import * as THREE from "three";
import {ModelLoader} from "./model-loader.ts";
import {FragmentMesh} from "bim-fragment";
import {MeshBVH} from "three-mesh-bvh";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type VoxelModelData = {
    position: THREE.Vector3
    color?: THREE.Color
}

export class ModelHandler {
    private _modelLoader: ModelLoader

    constructor(modelload: ModelLoader) {
        this._modelLoader = modelload;
    }

    public async voxelizeModel() {
        const groupFrag = this._modelLoader.getModel();
        if (!groupFrag) return;


        const timestampStart = new Date().getTime();
        for (let i = 0; i < groupFrag.items.length; i++) {
            const childMesh = groupFrag.items[i];
            if (childMesh.capacity === 1) {
                console.log('--------- childMesh', childMesh)
                const voxelTask = this.handleVoxelModel(childMesh.mesh as FragmentMesh)
                const arr: VoxelModelData[] = []
                for (const item of voxelTask) {
                    arr.push(item)
                }
                const mesh = this.recreateInstancedMesh(arr)
                this._modelLoader.getScene()?.get().add(mesh)
            }

        }
        const timestampEnd = new Date().getTime();
        console.log(`Success took ${timestampEnd - timestampStart} ms`)
    }

    private* handleVoxelModel(mesh: FragmentMesh) {
        const bvh = new MeshBVH(mesh.geometry);
        const boundingBox = new THREE.Box3().setFromObject(mesh);
        const invMat = new THREE.Matrix4().copy( mesh.matrix ).invert();

        const bbox = new THREE.BoxHelper(mesh, 0xffff00); // Màu vàng cho bounding box
        this._modelLoader.getScene()?.get().add(bbox);

        const rayX = new THREE.Ray();
        rayX.direction.set( 1, 0, 0 );

        const rayY = new THREE.Ray();
        rayY.direction.set( 0, 1, 0 );

        const rayZ = new THREE.Ray();
        rayZ.direction.set( 0, 0, 1 );


        const box = new THREE.Box3();
        // Get size data
        const gridSize = this._modelLoader.settings.gridSize;
        const boxSize = this._modelLoader.settings.boxSize;
        for (let x = boundingBox.min.x ; x <= boundingBox.max.x ; x += gridSize) {
            for (let y = boundingBox.min.y ; y <= boundingBox.max.y; y += gridSize) {
                for (let z = boundingBox.min.z ; z <= boundingBox.max.z; z += gridSize) {
                    // get position form center of voxel block
                    const centerPoint = new THREE.Vector3(x + boxSize / 2, y + boxSize / 2, z + boxSize / 2);
                    box.min.setScalar(-1*gridSize ).add( centerPoint );
                    box.max.setScalar(gridSize).add( centerPoint );

                    // test render box3
                    this.testRenderBox3(box, centerPoint);

                    const res = bvh.intersectsBox( box, invMat );

                    if (res) {
                        const result: VoxelModelData = {position: centerPoint};
                        yield result;
                    } else {
                        // transform into the local frame of the model
                        rayX.origin.copy( centerPoint ).applyMatrix4( invMat );
                        const resX = bvh.raycastFirst( rayX, THREE.DoubleSide );

                        rayY.origin.copy( centerPoint ).applyMatrix4( invMat );
                        const resY = bvh.raycastFirst( rayY, THREE.DoubleSide );

                        rayZ.origin.copy( centerPoint ).applyMatrix4( invMat );
                        const resZ = bvh.raycastFirst( rayZ, THREE.DoubleSide );

                        if (

                            resX && resX.face && resX.face.normal.dot( rayX.direction ) > 0 &&
                            resY && resY.face && resY.face.normal.dot( rayY.direction ) > 0 &&
                            resZ && resZ.face && resZ.face.normal.dot( rayZ.direction ) > 0

                        ) {
                            const result: VoxelModelData = {position: centerPoint};
                            yield result;
                        }
                    }
                }
            }
        }
    }

    private recreateInstancedMesh(array: VoxelModelData[]) {
        const boxSize = this._modelLoader.settings.boxSize;
        const boxRoundness = this._modelLoader.settings.boxRoundness;

        console.log("cnt", array.length)
        // remove the old mesh and voxels data
        const voxelGeometry = new RoundedBoxGeometry(boxSize, boxSize, boxSize, 2, boxRoundness)
        const voxelMaterial = new THREE.MeshLambertMaterial({ opacity: 0.4, transparent: true })
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
}