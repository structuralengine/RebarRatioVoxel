import * as THREE from "three";
import {ModelLoader} from "./model-loader.ts";
import {FragmentMesh} from "bim-fragment";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

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
        const edgeMaterial = new THREE.LineBasicMaterial({ color: '#3c3c3c', opacity: 0.4 });
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, edgeMaterial);
        line.position.copy(pointCenter)

        const material = new THREE.MeshBasicMaterial({ color: '#057400', opacity: 0.4, transparent: true });
        const voxelBlock = new THREE.Mesh(geometry, material);
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
    public concreteVolumne: number;
    public reinforcingBarList: FragmentMesh[];
    public boundingBox?: THREE.Box3;
    public voxelModelData: VoxelModelData[]

    constructor(modelLoader: ModelLoader) {
        this._modelLoader = modelLoader;
        this.concreteList = [];
        this.concreteVolumne = 0;
        this.reinforcingBarList = [];
        this.voxelModelData = [];
    }

    public getConcreteList() {
        return this.concreteList;
    }

    public cleanUp() {
        this.concreteList = []
        this.reinforcingBarList = []
        this.voxelModelData = []
    }

    public setup() {
        this.boundingBox = new THREE.Box3();
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
            this.boundingBox.union(objectBoundingBox);
        }

        const size = new THREE.Vector3();
        this.boundingBox.getSize(size)
        this.concreteVolumne = size.x * size.y * size.z;
        console.log('boundingBox', this.boundingBox, this.concreteVolumne);

        // drawing bounding box
        // const boundingBoxGeometry = new THREE.BoxGeometry(
        //     this.boundingBox.max.x - this.boundingBox.min.x,
        //     this.boundingBox.max.y - this.boundingBox.min.y,
        //     this.boundingBox.max.z - this.boundingBox.min.z
        // );
        //
        // const boundingBoxMesh = new THREE.Mesh(boundingBoxGeometry);
        // const boxHelper = new THREE.BoxHelper(boundingBoxMesh);
        // boxHelper.material.color.set(0x00ff00);
        // this._modelLoader.getScene()?.get().add(boxHelper);
    }
}