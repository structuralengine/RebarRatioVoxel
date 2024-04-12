import * as THREE from "three";
import {ModelLoader} from "./model-loader.ts";
import {FragmentMesh} from "bim-fragment";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export const voxelEdgeMaterial = new THREE.LineBasicMaterial({ color: '#3c3c3c', opacity: 0.4 });
export const voxelMaterial = new THREE.MeshBasicMaterial({ color: '#057400', opacity: 0.4, transparent: true });

export class VoxelModelData {
    public readonly id: string
    public center: THREE.Vector3
    public boxSize: number
    public boxRoundness: number
    public mesh: THREE.Object3D

    constructor(center: THREE.Vector3, boxSize: number, boxRoundness: number = 0) {
        this.center = center;
        this.boxSize = boxSize;
        this.boxRoundness = boxRoundness;
        this.mesh = this.createVoxelMesh(center, boxSize, boxRoundness);
        this.id = this.mesh.uuid;
    }

    private createVoxelMesh(pointCenter: THREE.Vector3, boxSize: number, boxRoundness: number = 0): THREE.Object3D {
        const geometry = new RoundedBoxGeometry(boxSize, boxSize, boxSize, 1, boxRoundness)

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, voxelEdgeMaterial.clone());
        line.position.copy(pointCenter)


        const voxelBlock = new THREE.Mesh(geometry, voxelMaterial.clone());
        voxelBlock.position.copy(pointCenter);

        const mergedObject = new THREE.Object3D();
        mergedObject.add(line)
        mergedObject.add(voxelBlock)

        return mergedObject;
    }
}


export class ModelElement {
    private _modelLoader: ModelLoader;
    public concreteList: FragmentMesh[];
    public concreteVolume: number;
    public reinforcingBarList: FragmentMesh[];
    public boundingBoxConcrete?: THREE.Box3;
    public voxelModelData: VoxelModelData[]

    constructor(modelLoader: ModelLoader) {
        this._modelLoader = modelLoader;
        this.concreteList = [];
        this.concreteVolume = 0;
        this.reinforcingBarList = [];
        this.voxelModelData = [];
    }

    public cleanUp() {
        this.concreteList = []
        this.reinforcingBarList = []
        this.voxelModelData = []
    }

    public setup() {
        this.boundingBoxConcrete = new THREE.Box3();
        for (const concrete of this.concreteList) {
            concrete.computeBoundingBox();
            concrete.computeBoundingSphere();

            concrete.geometry.computeBoundingBox()
            concrete.geometry.computeBoundingSphere()
            concrete.geometry.computeTangents()
            concrete.geometry.computeVertexNormals()

            if (concrete.boundingBox) {
                concrete.geometry.boundingBox = concrete.boundingBox.clone()
                const boundingSphere = new THREE.Sphere();
                concrete.boundingBox.clone().getBoundingSphere(boundingSphere);
                concrete.geometry.boundingSphere = boundingSphere
            }

            const objectBoundingBox = new THREE.Box3().setFromObject(concrete);
            this.boundingBoxConcrete.union(objectBoundingBox);
        }

        const size = new THREE.Vector3();
        this.boundingBoxConcrete.getSize(size)
        this.concreteVolume = size.x * size.y * size.z;
    }
    // public getVoxelMeshes(): THREE.Object3D[] {
    //     return this.voxelModelData.map(data => data.mesh);
    // }
    public getAllMeshesWithType(): { type: string, meshes: THREE.Object3D[] }[] {
        const meshesWithType = [
            { type: 'reinforcingBar', meshes: this.reinforcingBarList },
            { type: 'voxel', meshes: this.voxelModelData.map(data => data.mesh) }
        ];
        return meshesWithType;
    }
}

