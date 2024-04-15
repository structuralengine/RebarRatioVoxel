import * as THREE from "three";
import {ModelLoader} from "./model-loader.ts";
import {FragmentMesh} from "bim-fragment";
import {VoxelModelData} from "./model-element.ts";
import {MeshBVH} from "three-mesh-bvh";
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
        const boxRoundness = this._modelLoader.settings.boxRoundness;
        const maxDistance = Math.sqrt(3) * gridSize / 2;
        console.log('rays', rays)
        modelElement.voxelModelData = [];

        for (let x = boundingBoxOfConcrete.min.x; x <= boundingBoxOfConcrete.max.x + gridSize; x += gridSize) {
            for (let y = boundingBoxOfConcrete.min.y; y <= boundingBoxOfConcrete.max.y + gridSize; y += gridSize) {
                for (let z = boundingBoxOfConcrete.min.z; z <= boundingBoxOfConcrete.max.z + gridSize; z += gridSize) {
                    const centerPoint = new THREE.Vector3(x + gridSize / 2, y + gridSize / 2, z + gridSize / 2);

                    const box = new THREE.Box3()
                    box.min.setScalar( - gridSize ).add( centerPoint );
                    box.max.setScalar( gridSize ).add( centerPoint );

                    for (const mesh of concreteList) {
                        // if (this.checkCollision(centerPoint, mesh, maxDistance)) {
                        //     modelElement.voxelModelData.push(new VoxelModelData(centerPoint, boxSize, boxRoundness));
                        //     break;
                        // }

                        if (this.checkCollision2(box, mesh)) {
                            modelElement.voxelModelData.push(new VoxelModelData(centerPoint, boxSize, boxRoundness));
                            break;
                        }
                    }

                    // const voxel = new VoxelModelData(centerPoint, boxSize, boxRoundness);
                    // const box = voxel.mesh.children[1] as THREE.Mesh
                    // for (const mesh of concreteList) {
                    //     if (this.shapeCast(mesh, box, gridSize)) {
                    //         modelElement.voxelModelData.push(voxel);
                    //         break;
                    //     }
                    // }


                }
            }
        }

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

    private checkCollision2(box: THREE.Box3, model: FragmentMesh) {

        const invMat = new THREE.Matrix4().copy( model.matrixWorld.clone() ).invert();
        const res = model.geometry.boundsTree.intersectsBox( box, invMat );
        const ray = new THREE.Ray();
        ray.direction.set( 0, 0, 1 );

        if (res) {
            return true;
        } else {
            const res = model.geometry.boundsTree.raycastFirst( ray, 2 );
            if ( res && res.face.normal.dot( ray.direction ) > 0.0 ) {

                return true

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
        const rebarElement = this._modelLoader.getElement().reinforcingBarList;
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            voxel.reBarList = []
            const firstMesh = voxel.mesh.children[1] as THREE.Mesh

            let count = 0;
            rebarElement.map((rebar: FragmentMesh) => {
                const sphere = rebar.boundingSphere;
                if (!sphere) return
                const value = this.shapeCast(rebar, firstMesh, voxel.boxSize);

                if (value) {

                    voxel.reBarList.push(rebar)
                    count++;



                    // const box = new THREE.Box3().setFromObject(rebar);
                    // const helper = new THREE.BoxHelper(rebar, 0xffff00);
                    // this._modelLoader.getScene()?.get().add(helper);
                    // this._modelLoader.getScene()?.get().add(rebar);
                }
            })

            console.log('---------------------------------------', count)
            if (count > 5) {
                firstMesh.material.color.set(0xff0000)
            }
        });

        console.log('--------------  this._modelLoader.getElement().voxelModelData',  this._modelLoader.getElement().voxelModelData)
    }

    private shapeCast(targetMesh: FragmentMesh, shape: THREE.Mesh, size: number) {
        const transformMatrix =
            new THREE.Matrix4()
                .copy( targetMesh.matrixWorld )
                .invert()
                .multiply(shape.matrixWorld);

        const box = new THREE.Box3();

        box.min.setScalar( -size ).add( shape.position );
        box.max.setScalar(size).add( shape.position );
        // box.min.set( - size, - size, - size );
        // box.max.set( size, size, size );

        return targetMesh.geometry.boundsTree.intersectsGeometry( shape.geometry, transformMatrix );
        // return  geometry.boundsTree.intersectsBox( box, transformMatrix );
    }
}