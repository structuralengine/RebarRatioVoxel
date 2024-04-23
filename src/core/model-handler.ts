import * as THREE from "three";
import { ModelLoader } from "./model-loader.ts";
import { VoxelModelData } from "./model-element.ts";
import { BufferGeometry } from "three";
import { MeshBVH } from "three-mesh-bvh";

export const materialColorlist = [
    { color: '#00d4ff', label: '#00d4ff', ratio: '0%' },
    { color: '#09e8cd', label: '#09e8cd', ratio: '0% - 15%' },
    { color: '#09e810', label: '#09e810', ratio: '15% - 25%' },
    { color: '#e8de09', label: '#e8de09', ratio: '35% - 50%' },
    { color: '#e80909', label: '#e80909', ratio: ' > 50%' }
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

    public async reRenderVoxel(boxSize: number, boxRoundness: number, transparent: number) {
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            this._modelLoader.getScene()?.get().remove(voxel.mesh)
        })
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            voxel.mesh = voxel.createVoxelMesh(voxel.center, boxSize, boxRoundness, transparent)
            this._modelLoader.getScene()?.get().add(voxel.mesh)
        })
    }

    public async voxelizeModel() {
        const modelElement = this._modelLoader.getElement();
        const boundingBoxOfConcrete = modelElement.boundingBoxConcrete;
        const concreteMesh = this._modelLoader.getElement().concreteMesh
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
        console.log(gridSize, boxSize)
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
                    box.min.setScalar(-gridSize / 2).add(centerPoint);
                    box.max.setScalar(gridSize / 2).add(centerPoint);

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
        rayX.direction.set(1, 0, 0);

        const rayY = new THREE.Ray();
        rayY.direction.set(0, 1, 0);

        const rayZ = new THREE.Ray();
        rayZ.direction.set(0, 0, 1);

        if (res) {
            return true;
        } else {
            rayX.origin.copy(center).applyMatrix4(invMat);
            const resX = bvh.raycastFirst(rayX, THREE.DoubleSide);

            rayY.origin.copy(center).applyMatrix4(invMat);
            const resY = bvh.raycastFirst(rayY, THREE.DoubleSide);

            rayZ.origin.copy(center).applyMatrix4(invMat);
            const resZ = bvh.raycastFirst(rayZ, THREE.DoubleSide);
            if (
                resX && resX.face && resX.face.normal.dot(rayX.direction) > 0 &&
                resY && resY.face && resY.face.normal.dot(rayY.direction) > 0 &&
                resZ && resZ.face && resZ.face.normal.dot(rayZ.direction) > 0

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

        const rebar = this._modelLoader.getElement().reinforcingBarMesh;
        if (!rebar) return;
        rebar.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
                child.material.side = THREE.DoubleSide;
            }
        });

        const gridSize = 0.05
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            voxel.reBarList = []
            const minX = voxel.center.x - voxel.boxSize / 2;
            const minY = voxel.center.y - voxel.boxSize / 2;
            const minZ = voxel.center.z - voxel.boxSize / 2;

            const maxX = voxel.center.x + voxel.boxSize / 2;
            const maxY = voxel.center.y + voxel.boxSize / 2;
            const maxZ = voxel.center.z + voxel.boxSize / 2;

            let count = 0;

            for (let x = minX; x <= maxX; x += gridSize) {
                for (let y = minY; y < maxY; y += gridSize) {
                    for (let z = minZ; z < maxZ; z += gridSize) {
                        const centerPoint = new THREE.Vector3(x, y, z);

                        const box = new THREE.Box3()
                        box.min.setScalar(-gridSize / 2).add(centerPoint);
                        box.max.setScalar(gridSize / 2).add(centerPoint);

                        if (this.checkCollisionByBVH(centerPoint, box, rebar.matrixWorld, rebar.geometry)) {
                            count++;
                        }

                    }
                }
            }

            const volumeOfMesh = count * (gridSize ** 3)
            const voumeOfVoxel = voxel.boxSize ** 3;

            const ratio = volumeOfMesh * 100 / voumeOfVoxel;

            const hoverMesh = voxel.mesh.children[1] as THREE.Mesh
            let indexColor = 0;
            if (ratio > 0 && ratio < 15) {
                indexColor = 1;
            } else if (ratio >= 15 && ratio < 25) {
                indexColor = 2;
            } else if (ratio >= 35 && ratio < 50) {
                indexColor = 3;
            } else if (ratio >= 50) {
                indexColor = 4;
            }

            if (indexColor >= materialColorlist.length) {
                indexColor = materialColorlist.length - 1;
            }

            voxel.color = materialColorlist[indexColor].color;

            // @ts-ignore
            hoverMesh.material.color.set(voxel.color);
            for (let item of voxel.reBarList) {

                // @ts-ignore
                const itemMesh = (item as THREE.Mesh).material.clone();
                itemMesh.color.set(voxel.color);

                item.material = itemMesh;

                // @ts-ignore
                item.material.needsUpdate = true;
            }
        });
    }

}