import * as THREE from "three";
import { ModelLoader } from "./model-loader.ts";
import { Fragment, FragmentMesh } from "bim-fragment";
import { MeshBVH } from "three-mesh-bvh";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { VoxelModelData } from "./model-element.ts";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import { MeshBasicMaterial } from "three";

const rays = [
    new THREE.Vector3(0, 1, 0),   // Tia phía trên
    new THREE.Vector3(0, -1, 0),  // Tia phía dưới
    new THREE.Vector3(-1, 0, 0),  // Tia phía trái
    new THREE.Vector3(1, 0, 0),   // Tia phía phải
    new THREE.Vector3(0, 0, -1),  // Tia phía trước
    new THREE.Vector3(0, 0, 1),    // Tia phía sau
    //test
    new THREE.Vector3(1, 1, 0),   // Up-Right
    new THREE.Vector3(-1, 1, 0),  // Up-Left
    new THREE.Vector3(1, -1, 0),  // Down-Right
    new THREE.Vector3(-1, -1, 0), // Down-Left
    new THREE.Vector3(1, 0, 1),   // Right-Back
    new THREE.Vector3(-1, 0, 1),  // Left-Back
    new THREE.Vector3(0, 1, 1),   // Up-Back
    new THREE.Vector3(0, -1, 1),  // Down-Back
];

export class ModelHandler {
    private _modelLoader: ModelLoader

    constructor(modelload: ModelLoader) {
        this._modelLoader = modelload;
    }

    public cleanUp() {

    }
    public async voxelizeModel() {
        const modelElement = this._modelLoader.getElement();
        const concreteList = modelElement.concreteList;
        const boundingBoxOfConcrete = modelElement.boundingBox;
        if (concreteList.length < 1 || !boundingBoxOfConcrete) return;
        console.log('concreteList', concreteList)
        // Test bounding box
        const boxHelper = new THREE.Box3Helper(boundingBoxOfConcrete, 0xffff00);
        this._modelLoader.getScene()?.get().add(boxHelper);

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
        console.log('------ concreteList', concreteList);

        modelElement.voxelModelData = [];

        for (let x = boundingBoxOfConcrete.min.x; x <= boundingBoxOfConcrete.max.x + gridSize; x += gridSize) {
            for (let y = boundingBoxOfConcrete.min.y; y <= boundingBoxOfConcrete.max.y + gridSize; y += gridSize) {
                for (let z = boundingBoxOfConcrete.min.z; z <= boundingBoxOfConcrete.max.z + gridSize; z += gridSize) {
                    const centerPoint = new THREE.Vector3(x + boxSize / 2, y + boxSize / 2, z + boxSize / 2);

                    for (const mesh of concreteList) {
                        if (this.checkCollision(centerPoint, mesh)) {
                            modelElement.voxelModelData.push(new VoxelModelData(centerPoint, boxSize, boxRoundness));
                            break;
                        }
                    }
                }
            }
        }

        const timestampEnd = new Date().getTime();
        console.log(`Success took ${timestampEnd - timestampStart} ms`, modelElement.voxelModelData);

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

    public mergeTypedArrays(type, arrays) {
        var totalLength = 0;
        arrays.forEach(function (array) {
            totalLength += array.length;
        });
        var mergedArray = new type(totalLength);
        var offset = 0;
        arrays.forEach(function (array) {
            mergedArray.set(array, offset);
            offset += array.length;
        });
        return mergedArray;
    }

    public checkCollision(point: THREE.Vector3, mesh: FragmentMesh) {
        const raycaster = new THREE.Raycaster();

        for (const rayDirection of rays) {
            raycaster.set(point, rayDirection);
            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0 && (intersects[0].distance <= this._modelLoader.settings.gridSize / 2)) {
                return true;
            }
        }
        return false;
    }

    public async voxelizeModel2() {
        const concreteList = this._modelLoader.getElement().concreteList
        if (concreteList.length < 1) return;

        const timestampStart = new Date().getTime();
        for (let i = 0; i < concreteList.length; i++) {
            const childMesh = concreteList[i];
            const voxelTask = this.handleVoxelModel(childMesh as FragmentMesh)
            const arr: VoxelModelData[] = []
            for (const item of voxelTask) {
                arr.push(item)
            }
            const mesh = this.recreateInstancedMesh(arr)
            this._modelLoader.getScene()?.get().add(mesh)
        }
        const timestampEnd = new Date().getTime();
        console.log(`Success took ${timestampEnd - timestampStart} ms`)
    }

    private * handleVoxelModel(mesh: FragmentMesh) {
        const bvh = new MeshBVH(mesh.geometry);
        const boundingBox = this._modelLoader.getBoundingBox();
        const invMat = new THREE.Matrix4().copy(mesh.matrix).invert();

        const bbox = new THREE.BoxHelper(mesh, 0xffff00); // Màu vàng cho bounding box
        this._modelLoader.getScene()?.get().add(bbox);

        const rayX = new THREE.Ray();
        rayX.direction.set(1, 0, 0);

        const rayY = new THREE.Ray();
        rayY.direction.set(0, 1, 0);

        const rayZ = new THREE.Ray();
        rayZ.direction.set(0, 0, 1);


        // Get size data
        const gridSize = this._modelLoader.settings.gridSize;
        const boxSize = this._modelLoader.settings.boxSize;
        for (let x = boundingBox.min.x; x <= boundingBox.max.x; x += gridSize) {
            for (let y = boundingBox.min.y; y <= boundingBox.max.y; y += gridSize) {
                for (let z = boundingBox.min.z; z <= boundingBox.max.z; z += gridSize) {
                    // get position form center of voxel block
                    const centerPoint = new THREE.Vector3(x + boxSize / 2, y + boxSize / 2, z + boxSize / 2);

                    if (this.test(centerPoint, mesh)) {
                        console.log('----------------------- 123123')
                        const result: VoxelModelData = { position: centerPoint };
                        yield result;
                    }

                    // const box = new THREE.Box3();
                    // box.min.setScalar(-1*gridSize ).add( centerPoint );
                    // box.max.setScalar(gridSize).add( centerPoint );
                    //
                    // console.log('--------- box', box)
                    //
                    // // test render box3
                    // this.testRenderBox3(box, centerPoint);
                    //
                    // const res = bvh.intersectsBox( box, invMat );
                    //
                    // if (res) {
                    //     const result: VoxelModelData = {position: centerPoint};
                    //     yield result;
                    // } else {
                    //     // transform into the local frame of the model
                    //     rayX.origin.copy( centerPoint ).applyMatrix4( invMat );
                    //     const resX = bvh.raycastFirst( rayX, THREE.DoubleSide );
                    //
                    //     rayY.origin.copy( centerPoint ).applyMatrix4( invMat );
                    //     const resY = bvh.raycastFirst( rayY, THREE.DoubleSide );
                    //
                    //     rayZ.origin.copy( centerPoint ).applyMatrix4( invMat );
                    //     const resZ = bvh.raycastFirst( rayZ, THREE.DoubleSide );
                    //
                    //     console.log('--------------- resX', resX, resY,resZ )
                    //
                    //     if (
                    //         resX && resX.face && resX.face.normal.dot( rayX.direction ) > 0 &&
                    //         resY && resY.face && resY.face.normal.dot( rayY.direction ) > 0 &&
                    //         resZ && resZ.face && resZ.face.normal.dot( rayZ.direction ) > 0
                    //
                    //     ) {
                    //         const result: VoxelModelData = {position: centerPoint};
                    //         yield result;
                    //     }
                    // }
                }
            }
        }
    }

    private test(point: THREE.Vector3, mesh: FragmentMesh): boolean {
        const rayDirections = [
            new THREE.Vector3(1, 0, 0),   // Hướng phải
            new THREE.Vector3(-1, 0, 0),  // Hướng trái
            new THREE.Vector3(0, 1, 0),   // Hướng trên
            new THREE.Vector3(0, -1, 0),  // Hướng dưới
            new THREE.Vector3(0, 0, 1),   // Hướng trước
            new THREE.Vector3(0, 0, -1)   // Hướng sau
        ];
        let count = 0;
        const raycaster = new THREE.Raycaster();
        for (const direction of rayDirections) {
            raycaster.set(point, direction);
            const intersects = raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                count++;
            }
        }
        return count >= 3;
    }

    private recreateInstancedMesh(array: VoxelModelData[]) {
        const boxSize = this._modelLoader.settings.boxSize;
        const boxRoundness = this._modelLoader.settings.boxRoundness;

        console.log("cnt", array.length)
        // remove the old mesh and voxels data
        const voxelGeometry = new RoundedBoxGeometry(boxSize, boxSize, boxSize, 2, boxRoundness)
        const voxelMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 0.4, transparent: true })
        const dummy = new THREE.Object3D();

        // create a new instanced mesh object
        const instancedMesh = new THREE.InstancedMesh(voxelGeometry, voxelMaterial, array.length);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;

        // assign voxels data to the instanced mesh
        for (let i = 0; i < array.length; i++) {
            instancedMesh.setColorAt(i, array[i].color || new THREE.Color().setHSL(.4, .4, .4));
            dummy.position.copy(array[i].position);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        return instancedMesh
    }

    private testRenderBox3(box: THREE.Box3, centerPoint: THREE.Vector3) {
        const boxGeometry = new THREE.BoxGeometry(box.max.x - box.min.x,
            box.max.y - box.min.y,
            box.max.z - box.min.z);
        const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        const boxVoxel = new THREE.Mesh(boxGeometry, boxMaterial);
        boxVoxel.position.copy(centerPoint);
        const boxVoxelRender = new THREE.BoxHelper(boxVoxel, 0xffff00); // Màu vàng cho bounding box
        this._modelLoader.getScene()?.get().add(boxVoxelRender);

    }

    private testRenderCenterVoxel(point: THREE.Vector3) {
        const dotGeometry = new THREE.BufferGeometry();
        dotGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([point.x, point.y, point.z]), 3));
        const dotMaterial = new THREE.PointsMaterial({ size: 0.05, color: 0xff0000 });
        const dot = new THREE.Points(dotGeometry, dotMaterial);
        this._modelLoader.getScene()?.get().add(dot);
    }
}