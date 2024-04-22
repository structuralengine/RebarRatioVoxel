import * as THREE from "three";
import {ModelLoader} from "./model-loader.ts";
import {FragmentMesh} from "bim-fragment";
import {VoxelModelData} from "./model-element.ts";
import {BufferGeometry, MeshBasicMaterial} from "three";
import {MeshBVH} from "three-mesh-bvh";
import { CSG } from 'three-csg-ts';

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

export const materialColorlist = [
    { color: '#00d4ff', label: '#00d4ff' },
    { color: '#09e8cd', label: '#09e8cd' },
    { color: '#09e810', label: '#09e810' },
    { color: '#e8de09', label: '#e8de09' },
    { color: '#e80909', label: '#e80909' }
]
export class ModelHandler {
    private _modelLoader: ModelLoader

    constructor(modelload: ModelLoader) {
        this._modelLoader = modelload;
    }

    public cleanUp() {

    }

    public async reSetupVoxel() {
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            this._modelLoader.getScene()?.get().remove(voxel.mesh)
        })
        await this.voxelizeModel()
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            this._modelLoader.getScene()?.get().add(voxel.mesh)
        })
    }

    public async voxelizeModel() {
        const modelElement = this._modelLoader.getElement();
        const boundingBoxOfConcrete = modelElement.boundingBoxConcrete;
        const concreteMesh= this._modelLoader.getElement().concreteMesh
        if (!concreteMesh || !boundingBoxOfConcrete) return;

        // Test bounding box
        // const boxHelper = new THREE.Box3Helper(boundingBoxOfConcrete, 0xffff00);
        // this._modelLoader.getScene()?.get().add(boxHelper);

        // Traverse mesh
        concreteMesh.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
                child.material.side = THREE.DoubleSide;
            }
        });

        const gridSize = this._modelLoader.settings.gridSize;
        const boxSize = this._modelLoader.settings.boxSize;
        console.log(gridSize, boxSize )
        // const gridSize = 0.18;
        // const boxSize = 0.18;

        const boxRoundness = this._modelLoader.settings.boxRoundness;
        const transparent = this._modelLoader.settings.transparent

        modelElement.voxelModelData = [];

        const minX = boundingBoxOfConcrete.min.x
        const minY = boundingBoxOfConcrete.min.y
        const minZ = boundingBoxOfConcrete.min.z

        const maxX = 1 + ((boundingBoxOfConcrete.max.x - minX) / gridSize)
        const maxY = 1 + ((boundingBoxOfConcrete.max.y - minY) / gridSize)
        const maxZ = 1 + ((boundingBoxOfConcrete.max.z - minZ) / gridSize)

        // New algorithm
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

                    if (this.checkCollisionByBVH(centerPoint, box, concreteMesh.matrixWorld, concreteMesh.geometry)) {
                        modelElement.voxelModelData.push(new VoxelModelData(centerPoint, boxSize, boxRoundness, transparent));
                    }
                }
            }
        }

        console.log('Voxel data length: ', modelElement.voxelModelData.length)
    }


    // New algorithm check collision
    private checkCollisionByBVH(center: THREE.Vector3, box: THREE.Box3, matrixWorld: THREE.Matrix4, geometry: BufferGeometry) {
        const invMat = new THREE.Matrix4().copy(matrixWorld.clone()).invert();

        // @ts-ignore
        const bvh = geometry.boundsTree as MeshBVH;
        const res = bvh.intersectsBox(box, invMat);

        const rayX = new THREE.Ray();
        rayX.direction.set( 1, 0, 0 );

        if (res) {
            return true;
        } else {
            rayX.origin.copy( center ).applyMatrix4( invMat );
            const resX = bvh.raycastFirst( rayX, THREE.DoubleSide );
            if (
                resX && resX.face && resX.face.normal.dot( rayX.direction ) > 0
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
        // this._modelLoader?.getScene()?.get().updateMatrixWorld()
        // const rebarElement = this._modelLoader.getElement()._reinforcingBarList;
        // this.test(rebarElement);
        // this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
        //     voxel.reBarList = []
        //     const firstMesh = voxel.mesh.children[1] as THREE.Mesh
        //     firstMesh.updateMatrixWorld()
        //     let count = 0;
        //     rebarElement.map((rebar: FragmentMesh) => {
        //         const sphere = rebar.boundingSphere;
        //         if (!sphere) return
        //
        //         const box = new THREE.Box3()
        //         box.min.setScalar( -voxel.boxSize ).add( voxel.center );
        //         box.max.setScalar( voxel.boxSize ).add( voxel.center );
        //
        //         // @ts-ignore
        //         const geometry = rebar.convertGeometry;
        //         const value = this.shapeCast(rebar, geometry, firstMesh, voxel);
        //
        //         if (value) {
        //             voxel.reBarList.push(rebar)
        //             count++;
        //         }
        //     })
        //
        //     const l = voxel.reBarList.length;
        //     const hoverMesh = voxel.mesh.children[1] as THREE.Mesh
        //     let indexColor = 0;
        //     if (l > 0 && l < 2) {
        //         indexColor = 1;
        //     } else if (l >= 2 && l < 5) {
        //         indexColor = 2;
        //     } else if (l >= 5 && l < 8) {
        //         indexColor = 3;
        //     } else if (l >= 8) {
        //         indexColor = 4;
        //     }
        //
        //     if (indexColor >= materialColorlist.length) {
        //         indexColor = materialColorlist.length - 1;
        //     }
        //
        //     voxel.color = materialColorlist[indexColor].color;
        //     hoverMesh.material.color.set(voxel.color);
        //     for (let item of voxel.reBarList) {
        //         const itemMesh = (item as THREE.Mesh).material.clone();
        //         itemMesh.color.set(voxel.color);
        //
        //         item.material = itemMesh;
        //         item.material.needsUpdate = true;
        //     }
        // });
    }

    private test(rebarElement: FragmentMesh[]) {
        const voxel = this._modelLoader.getElement().voxelModelData[20];
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

            // @ts-ignore
            const geometry = rebar.convertGeometry as BufferGeometry;
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();

            const newMesh = new THREE.Mesh(geometry)

            const interRes = CSG.intersect(newMesh, firstMesh);
            interRes.position.add(voxel.center);

            this._modelLoader.getScene()?.get().add(interRes)

            if ( interRes) {
                voxel.reBarList.push(rebar)
                count++;
            }
        })

        const l = voxel.reBarList.length;
        const hoverMesh = voxel.mesh.children[1] as THREE.Mesh
        let indexColor = 0;
        if (l > 0 && l < 2) {
            indexColor = 1;
        } else if (l >= 2 && l < 5) {
            indexColor = 2;
        } else if (l >= 5 && l < 8) {
            indexColor = 3;
        } else if (l >= 8) {
            indexColor = 4;
        }

        if (indexColor >= materialColorlist.length) {
            indexColor = materialColorlist.length - 1;
        }

        voxel.color = materialColorlist[indexColor].color;
        hoverMesh.material.color.set(voxel.color);
        for (let item of voxel.reBarList) {
            const itemMesh = (item as THREE.Mesh).material.clone();
            itemMesh.color.set(voxel.color);

            item.material = itemMesh;
            item.material.needsUpdate = true;
        }
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