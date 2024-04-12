import * as THREE from "three";
import {ModelLoader} from "./model-loader.ts";
import {FragmentMesh} from "bim-fragment";
import {VoxelModelData} from "./model-element.ts";

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

const materialColorlist = [
    { color: 0x09e8cd, label: 'Color 1' },
    { color: 0x09e810, label: 'Color 2' },
    { color: 0xe8de09, label: 'Color 3' },
    { color: 0xe80909, label: 'Color 4' }
]
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
        console.log('------ concreteList', concreteList);
        console.log('rays', rays)
        modelElement.voxelModelData = [];

        for (let x = boundingBoxOfConcrete.min.x; x <= boundingBoxOfConcrete.max.x + gridSize; x += gridSize) {
            for (let y = boundingBoxOfConcrete.min.y; y <= boundingBoxOfConcrete.max.y + gridSize; y += gridSize) {
                for (let z = boundingBoxOfConcrete.min.z; z <= boundingBoxOfConcrete.max.z + gridSize; z += gridSize) {
                    const centerPoint = new THREE.Vector3(x + gridSize / 2, y + gridSize / 2, z + gridSize / 2);

                    for (const mesh of concreteList) {
                        if (this.checkCollision(centerPoint, mesh, maxDistance)) {
                            const newVoxel = new VoxelModelData(centerPoint, boxSize, boxRoundness);
                            modelElement.voxelModelData.push(newVoxel);
                            const reinforcingBarInVoxel = this.geAllCollidingObjects(newVoxel.mesh);
                            const l = reinforcingBarInVoxel.length;
                            const hoverMesh = newVoxel.mesh.children[1] as THREE.Mesh
                            let color = 0x00d4ff;
                            for (const colorItem of materialColorlist) {
                                if (l > 0 && l < 2 && colorItem.label === 'Color 1') {
                                    color = colorItem.color;
                                } else if (l >= 2 && l < 5 && colorItem.label === 'Color 2') {
                                    color = colorItem.color;
                                } else if (l >= 5 && l < 8 && colorItem.label === 'Color 3') {
                                    color = colorItem.color;
                                } else if (l >= 8 && l < 10 && colorItem.label === 'Color 4') {
                                    color = colorItem.color;
                                } else if (l >= 10 && colorItem.label === 'Color 4') {
                                    color = colorItem.color;
                                }
                            }
                            hoverMesh.material.color.set(color);
                            break;
                        }
                    }
                }
            }
        }

        const timestampEnd = new Date().getTime();
        console.log(`Success took ${timestampEnd - timestampStart} ms`, modelElement.voxelModelData);

    }

    private geAllCollidingObjects(mesh:THREE.Object3D) {
        const fromMeshes = this._modelLoader.getElement().reinforcingBarList;//returns all Boxes of the scene
        const boundary = new THREE.Box3().setFromObject(mesh);
        const collidingObjs:THREE.Object3D[]=[];
        fromMeshes.forEach((meshNow:THREE.Object3D)=>
        {
            const otherBounds = new THREE.Box3().setFromObject(meshNow);
            if(boundary.intersectsBox(otherBounds))
            {
                collidingObjs.push(meshNow)
            }
        });
        return collidingObjs;
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

    public renderVoxelModel(isShow: boolean = true) {
        this._modelLoader.getElement().voxelModelData.forEach((voxel: VoxelModelData) => {
            if (isShow) {
                this._modelLoader.getScene()?.get().add(voxel.mesh)
            } else {
                this._modelLoader.getScene()?.get().remove(voxel.mesh)
            }
        })
    }

}