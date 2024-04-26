import * as THREE from "three";
import { ModelLoader } from "./model-loader.ts";
import { VoxelModelData } from "./model-element.ts";
import { BufferGeometry } from "three";
import { MeshBVH } from "three-mesh-bvh";

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

        // Traverse mesh
        concreteMesh.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
                child.material.side = THREE.DoubleSide;
            }
        });

        const boxSize = this._modelLoader.settings.boxSize;

        const boxRoundness = this._modelLoader.settings.boxRoundness;
        const transparent = this._modelLoader.settings.transparent

        modelElement.voxelModelData = [];
        modelElement.voxelHasRebar = [];
        modelElement.voxelHasNotRebar = [];

        const minX = boundingBoxOfConcrete.min.x
        const minY = boundingBoxOfConcrete.min.y
        const minZ = boundingBoxOfConcrete.min.z

        const maxX = 1 + ((boundingBoxOfConcrete.max.x - minX) / boxSize)
        const maxY = 1 + ((boundingBoxOfConcrete.max.y - minY) / boxSize)
        const maxZ = 1 + ((boundingBoxOfConcrete.max.z - minZ) / boxSize)


        this._modelLoader?.getScene()?.get().updateMatrixWorld()
        const rebar = this._modelLoader.getElement().reinforcingBarMesh;
        if (!rebar) return;
        rebar.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
                child.material.side = THREE.DoubleSide;
            }
        });

        // New algorithm
        for (let i = 0; i < maxX; i++) {
            for (let j = 0; j < maxY; j++) {
                for (let k = 0; k < maxZ; k++) {
                    const x = minX + boxSize * i;
                    const y = minY + boxSize * j;
                    const z = minZ + boxSize * k;
                    const centerPoint = new THREE.Vector3(x, y, z);

                    const box = new THREE.Box3()
                    box.min.setScalar(-boxSize / 2).add(centerPoint);
                    box.max.setScalar(boxSize / 2).add(centerPoint);

                    if (this.checkCollisionByBVH(centerPoint, box, concreteMesh.matrixWorld, concreteMesh.geometry)) {
                        const newVoxel = new VoxelModelData(centerPoint, boxSize, boxRoundness, transparent)
                        modelElement.voxelModelData.push(newVoxel);
                        if(this.checkCollisionRebarByBVH(centerPoint,box,rebar.matrixWorld,rebar.geometry)) {
                            modelElement.voxelHasRebar.push(newVoxel)
                        } else {
                            modelElement.voxelHasNotRebar.push(newVoxel)
                        }
                    }
                }
            }
        }
        console.log(modelElement.voxelHasRebar.length, modelElement.voxelHasNotRebar.length)
    }

    private checkCollisionByBVH(center: THREE.Vector3, box: THREE.Box3, matrixWorld: THREE.Matrix4, geometry: BufferGeometry) {
        const invMat = new THREE.Matrix4().copy(matrixWorld.clone()).invert();

        // @ts-ignore
        const bvh = geometry.boundsTree as MeshBVH;
        const res = bvh.intersectsBox(box, invMat);

        if (res) {
            return true;
        } else {
            const rayX = new THREE.Ray();
            rayX.direction.set(1, 0, 0);
    
            const rayY = new THREE.Ray();
            rayY.direction.set(0, 1, 0);
    
            const rayZ = new THREE.Ray();
            rayZ.direction.set(0, 0, 1);

            rayX.origin.copy(center).applyMatrix4(invMat);
            const resX = bvh.raycastFirst(rayX, THREE.DoubleSide);

            rayY.origin.copy(center).applyMatrix4(invMat);
            const resY = bvh.raycastFirst(rayY, THREE.DoubleSide);

            rayZ.origin.copy(center).applyMatrix4(invMat);
            const resZ = bvh.raycastFirst(rayZ, THREE.DoubleSide);

            if (
                (resX && resX.face && resX.face.normal.dot(rayX.direction) > 0)
                || (resY && resY.face  &&  resY.face.normal.dot(rayY.direction) > 0)
                || (resZ && resZ.face  && resZ.face.normal.dot(rayZ.direction) > 0)
            ) {
                return true;
            }
        }

        return false;
    }

    private checkCollisionRebarByBVH(center: THREE.Vector3, box: THREE.Box3, matrixWorld: THREE.Matrix4, geometry: BufferGeometry) {
        const invMat = new THREE.Matrix4().copy(matrixWorld.clone()).invert();

        // @ts-ignore
        const bvh = geometry.boundsTree as MeshBVH;
        const res = bvh.intersectsBox(box, invMat);

        if (res) {
            return true;
        } else {
            const rayX = new THREE.Ray();
            rayX.direction.set(1, 0, 0);
    
            const rayY = new THREE.Ray();
            rayY.direction.set(0, 1, 0);
    
            const rayZ = new THREE.Ray();
            rayZ.direction.set(0, 0, 1);

            rayX.origin.copy(center).applyMatrix4(invMat);
            const resX = bvh.raycastFirst(rayX, THREE.DoubleSide);
            
            rayY.origin.copy(center).applyMatrix4(invMat);
            const resY = bvh.raycastFirst(rayY, THREE.DoubleSide);

            rayZ.origin.copy(center).applyMatrix4(invMat);
            const resZ = bvh.raycastFirst(rayZ, THREE.DoubleSide);

            if (
                (resX && resX.face && resX.faceIndex == 1 && resX.face.normal.dot(rayX.direction) > 0)
                || (resY && resY.face  &&  resY.faceIndex == 1 && resY.face.normal.dot(rayY.direction) > 0)
                || (resZ && resZ.face  && resZ.faceIndex == 1 && resZ.face.normal.dot(rayZ.direction) > 0)
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

    public detectRebarAndVoxel(rebar: THREE.Mesh, gridSize: number = 0.05) {
        const modelElement = this._modelLoader.getElement()
        modelElement.voxelModelData.forEach((voxel: VoxelModelData) => {
            this._modelLoader.getScene()?.get().remove(voxel.mesh)
        })
        const materialColorList = localStorage.getItem('materialColorList')
        let colorList = null
        if (materialColorList !== null) {
            colorList = JSON.parse(materialColorList)
        }
        colorList = colorList.map((color: any) => ({
            ...color,
            quantity: 0
        }));

        modelElement.voxelHasNotRebar.forEach((voxel : VoxelModelData) => {
            let indexColor = 0;
            const mesh = voxel.mesh.children[1] as THREE.Mesh
            colorList[indexColor].quantity++
            voxel.color = colorList[indexColor].color;
            // @ts-ignore
            mesh.material.color.set(voxel.color);
        })

        this._modelLoader.getElement().voxelHasRebar.forEach((voxel: VoxelModelData) => {
            const minX = voxel.center.x - voxel.boxSize / 2;
            const minY = voxel.center.y - voxel.boxSize / 2;
            const minZ = voxel.center.z - voxel.boxSize / 2;

            const maxX = (voxel.center.x + voxel.boxSize / 2 - minX) / gridSize;
            const maxY = (voxel.center.y + voxel.boxSize / 2 - minY) / gridSize;
            const maxZ = (voxel.center.z + voxel.boxSize / 2 - minZ) / gridSize;

            let count = 0;
            for (let x = 0; x < maxX - gridSize; x++) {
                for (let y = 0; y < maxY - gridSize; y++) {
                    for (let z = 0; z < maxZ - gridSize; z++) {
                        const centerPoint = new THREE.Vector3(
                            minX + gridSize * x, 
                            minY + gridSize * y, 
                            minZ + gridSize * z
                        );

                        const box = new THREE.Box3()
                        box.min.setScalar(-gridSize / 2).add(centerPoint);
                        box.max.setScalar(gridSize / 2).add(centerPoint);
                        
                        if (this.checkCollisionRebarByBVH(centerPoint, box, rebar.matrixWorld, rebar.geometry)) {
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
            let lastIndex = colorList.length - 1;
            for (let i = 1; i <= lastIndex; i++) {
                if (ratio > colorList[i].ratio.min && ratio <= colorList[i].ratio.max) {
                    indexColor = i;
                    break;
                }
            }
        
            if (ratio > colorList[lastIndex].ratio.max) {
                indexColor = lastIndex;
            }

            colorList[indexColor].quantity++
            voxel.color = colorList[indexColor].color;

            // @ts-ignore
            hoverMesh.material.color.set(voxel.color);
        });
        modelElement.voxelModelData = [...modelElement.voxelHasNotRebar,...modelElement.voxelHasRebar]

        modelElement.voxelModelData.forEach((voxel: VoxelModelData) => {
            this._modelLoader.getScene()?.get().add(voxel.mesh)
        })
        localStorage.setItem('materialColorList', JSON.stringify(colorList))
    }
    
}