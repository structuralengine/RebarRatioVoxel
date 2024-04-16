import * as THREE from "three";
import {ModelLoader} from "./model-loader.ts";
import {FragmentMesh} from "bim-fragment";
import {VoxelModelData} from "./model-element.ts";
import {MeshBVH, MeshBVHHelper} from "three-mesh-bvh";
import {Box3, BufferGeometry, LineSegments} from "three";

const rays = [
    // ray directions to the center of voxel
    new THREE.Vector3(0, 1, 0),   // Up
    new THREE.Vector3(0, -1, 0),  // Down
    new THREE.Vector3(-1, 0, 0),  // Left
    new THREE.Vector3(1, 0, 0),   // Right
    new THREE.Vector3(0, 0, -1),  // Front
    new THREE.Vector3(0, 0, 1),    // Back
    // ray directions to the edge of voxel
    new THREE.Vector3(1, 1, 0),   // Up-Right
    new THREE.Vector3(-1, 1, 0),  // Up-Left
    new THREE.Vector3(1, -1, 0),  // Down-Right
    new THREE.Vector3(-1, -1, 0), // Down-Left
    new THREE.Vector3(1, 0, 1),   // Right-Back
    new THREE.Vector3(-1, 0, 1),  // Left-Back
    new THREE.Vector3(0, 1, 1),   // Up-Back
    new THREE.Vector3(0, -1, 1),  // Down-Back
    // ray directions to the corner of voxel
    new THREE.Vector3(1, 1, 1),   // Top-Right-Front
    new THREE.Vector3(-1, 1, 1),  // Top-Left-Front
    new THREE.Vector3(1, -1, 1),  // Bottom-Right-Front
    new THREE.Vector3(-1, -1, 1), // Bottom-Left-Front
    new THREE.Vector3(1, 1, -1),  // Top-Right-Back
    new THREE.Vector3(-1, 1, -1), // Top-Left-Back
    new THREE.Vector3(1, -1, -1), // Bottom-Right-Back
    new THREE.Vector3(-1, -1, -1) // Bottom-Left-Back
];

export class ModelHandler {
    private _modelLoader: ModelLoader

    constructor(modelload: ModelLoader) {
        this._modelLoader = modelload;
    }

    public cleanUp() {

    }

    public reSetupVoxel() {
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            this._modelLoader.getScene()?.get().remove(voxel.mesh)
        })
        this.voxelizeModel()
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            this._modelLoader.getScene()?.get().add(voxel.mesh)
        })
    }

    public async voxelizeModel() {
        const modelElement = this._modelLoader.getElement();
        const concreteList = modelElement.concreteList;
        const boundingBoxOfConcrete = modelElement.boundingBoxConcrete;
        if (concreteList.length < 1 || !boundingBoxOfConcrete) return;
        console.log('concreteList', concreteList)

        // Test bounding box
        // const boxHelper = new THREE.Box3Helper(boundingBoxOfConcrete, 0xffff00);
        //this._modelLoader.getScene()?.get().add(boxHelper);

        // Traverse mesh
        for (const concrete of concreteList) {
            concrete.traverse((child: any) => {
                if (child instanceof THREE.Mesh) {
                    child.material.side = THREE.DoubleSide;
                }
            });
        }

        const timestampStart = new Date().getTime();
        const gridSize = this._modelLoader.settings.gridSize;
        const boxSize = this._modelLoader.settings.boxSize;

        // const gridSize = 0.18;
        // const boxSize = 0.18;

        const boxRoundness = this._modelLoader.settings.boxRoundness;
        const maxDistance = Math.sqrt(3) * gridSize / 2;
        console.log('rays', rays)
        modelElement.voxelModelData = [];

        const resolution = this._modelLoader.settings.gridSize;

        const minX = boundingBoxOfConcrete.min.x
        const minY = boundingBoxOfConcrete.min.y
        const minZ = boundingBoxOfConcrete.min.z

        const maxX = 1 + ((boundingBoxOfConcrete.max.x - minX) / gridSize)
        const maxY = 1 + ((boundingBoxOfConcrete.max.y - minY) / gridSize)
        const maxZ = 1 + ((boundingBoxOfConcrete.max.z - minZ) / gridSize)

        for (let i = 0; i < maxX; i++) {
            for (let j = 0; j < maxY; j++) {
                for (let k = 0; k < maxZ; k++) {
                    const x = minX + gridSize * i;
                    const y = minY + gridSize * j;
                    const z = minZ + gridSize * k;
                    const centerPoint = new THREE.Vector3(x, y, z);

                    const box = new THREE.Box3()
                    box.min.setScalar( -gridSize/2 ).add( centerPoint );
                    box.max.setScalar( gridSize/2 ).add( centerPoint );

                    for (let c = 0; c < concreteList.length; c++) {
                        const mesh = concreteList[c];
                        const geometry = mesh.convertGeometry;
                        if (this.checkCollisionByBVH(centerPoint, box, mesh, geometry)) {
                            modelElement.voxelModelData.push(new VoxelModelData(centerPoint, boxSize, boxRoundness));
                            break;
                        }
                    }
                }
            }
        }

        // for (let x = boundingBoxOfConcrete.min.x; x <= boundingBoxOfConcrete.max.x; x += gridSize) {
        //     for (let y = boundingBoxOfConcrete.min.y; y <= boundingBoxOfConcrete.max.y; y += gridSize) {
        //         for (let z = boundingBoxOfConcrete.min.z; z <= boundingBoxOfConcrete.max.z; z += gridSize) {
        //             const centerPoint = new THREE.Vector3(x + gridSize / 2, y + gridSize / 2, z + gridSize / 2);
        //
        //             const box = new THREE.Box3()
        //             box.min.setScalar( -gridSize ).add( centerPoint );
        //             box.max.setScalar( gridSize ).add( centerPoint );
        //
        //             for (let i = 0; i < concreteList.length; i++) {
        //                 const mesh = concreteList[i];
        //                 const geometry = mesh.convertGeometry;
        //
        //                 // if (this.checkCollision(centerPoint, mesh, maxDistance)) {
        //                 //     modelElement.voxelModelData.push(new VoxelModelData(centerPoint, boxSize, boxRoundness));
        //                 //     break;
        //                 // }
        //
        //                 if (this.checkCollisionByBVH(centerPoint, box, mesh, geometry)) {
        //                     modelElement.voxelModelData.push(new VoxelModelData(centerPoint, boxSize, boxRoundness));
        //                     break;
        //                 }
        //             }
        //         }
        //     }
        // }

        const timestampEnd = new Date().getTime();
        console.log(`Success took ${timestampEnd - timestampStart} ms`, modelElement.voxelModelData);

    }

    private checkCollision(point: THREE.Vector3, mesh: FragmentMesh, maxDistance: number) {
        const raycaster = this._modelLoader.getRaycaster()?.get();
        if (!raycaster) return false;

        for (const rayDirection of rays) {
            raycaster.set(point, rayDirection);
            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                for (let intersect of intersects) {
                    if (intersect.distance <= maxDistance) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private checkCollisionByBVH(center: THREE.Vector3, box: THREE.Box3, model: FragmentMesh, geometry: BufferGeometry) {

        const invMat = new THREE.Matrix4().copy( model.matrixWorld.clone() ).invert();
        const res = geometry.boundsTree.intersectsBox( box, invMat );

        const rayX = new THREE.Ray();
        rayX.direction.set( 1, 0, 0 );

        const rayY = new THREE.Ray();
        rayY.direction.set( 0, 1, 0 );

        const rayZ = new THREE.Ray();
        rayZ.direction.set( 0, 0, 1 );

        if (res) {
            return true;
        } else {
            rayX.origin.copy( center ).applyMatrix4( invMat );
            const resX = geometry.boundsTree.raycastFirst( rayX, THREE.DoubleSide );

            rayY.origin.copy( center ).applyMatrix4( invMat );
            const resY = geometry.boundsTree.raycastFirst( rayY, THREE.DoubleSide );

            rayZ.origin.copy( center ).applyMatrix4( invMat );
            const resZ = geometry.boundsTree.raycastFirst( rayZ, THREE.DoubleSide );

            if (
                resX && resX.face.normal.dot( rayX.direction ) > 0 ||
                resY && resY.face.normal.dot( rayY.direction ) > 0 ||
                resZ && resZ.face.normal.dot( rayZ.direction ) > 0

            ) {
                return true;
            }
        }

        return false;
    }

    public renderVoxelModel(isShow: boolean = true) {
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            if (isShow) {
                this._modelLoader.getScene()?.get().add(voxel.mesh)
            } else {
                this._modelLoader.getScene()?.get().remove(voxel.mesh)
            }
        })
    }

    public detectRebarAndVoxel() {
        this._modelLoader?.getScene()?.get().updateMatrixWorld()
        const rebarElement = this._modelLoader.getElement().reinforcingBarList;
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            voxel.reBarList = []
            const firstMesh = voxel.mesh.children[1] as THREE.Mesh
            firstMesh.updateMatrixWorld()
            let count = 0;
            rebarElement.map((rebar: FragmentMesh) => {
                const sphere = rebar.boundingSphere;
                if (!sphere) return

                const box = new THREE.Box3()
                box.min.setScalar( -voxel.boxSize ).add( voxel.center );
                box.max.setScalar( voxel.boxSize ).add( voxel.center );

                const geometry = rebar.convertGeometry;
                const value = this.shapeCast(rebar, geometry, firstMesh, voxel);

                if (value) {
                    voxel.reBarList.push(rebar)
                    count++;
                }
            })

            console.log('count voxel collision with rebar', count)
            if (count > 0 && count <= 2) {
                firstMesh.material.color.set('#00ffec')
            } else if (count > 2 && count <= 4) {
                firstMesh.material.color.set('#0228ac')
            }
            else if (count > 4 && count <= 6) {
                firstMesh.material.color.set('#afb300')
            }
            else if (count > 6) {
                firstMesh.material.color.set('#c70000')
            }
        });
    }

    private shapeCast(targetMesh: FragmentMesh, geometry: BufferGeometry, shape: THREE.Mesh, voxel: VoxelModelData) {
        const transformMatrix =
            new THREE.Matrix4()
                .copy( targetMesh.matrixWorld ).invert()
                .multiply( shape.matrixWorld );

        const box = new THREE.Box3();
        box.min.set( -voxel.boxSize/2,-voxel.boxSize/2,-voxel.boxSize/2 );
        box.max.set( voxel.boxSize/2,voxel.boxSize/2,voxel.boxSize/2 );
        return geometry.boundsTree.intersectsBox( box, transformMatrix );
    }

}