import * as THREE from "three";
import {ModelLoader} from "./model-loader.ts";
import {FragmentMesh} from "bim-fragment";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {MeshBVH} from "three-mesh-bvh";

export const voxelEdgeMaterial = new THREE.LineBasicMaterial({ color: '#3c3c3c', opacity: 0.4 });
export const voxelMaterial = new THREE.MeshBasicMaterial({ color: '#057400', opacity: 0.4, transparent: true });

export const defaultColor = '#057400';

export class VoxelModelData {
    public readonly id: string
    public center: THREE.Vector3
    public boxSize: number
    public boxRoundness: number
    public transparent: number
    public mesh: THREE.Object3D
    public color: string
    public reBarList: FragmentMesh[]

    constructor(center: THREE.Vector3, boxSize: number, boxRoundness: number = 0, transparent: number) {
        this.center = center;
        this.boxSize = boxSize;
        this.boxRoundness = boxRoundness;
        this.transparent = transparent
        this.mesh = this.createVoxelMesh(center, boxSize, boxRoundness, transparent);
        this.id = this.mesh.uuid;
        this.reBarList = [];
        this.color = defaultColor;
    }

    private createVoxelMesh(pointCenter: THREE.Vector3, boxSize: number, boxRoundness: number = 0, transparent: number): THREE.Object3D {
        const geometry = new RoundedBoxGeometry(boxSize, boxSize, boxSize, 0.1, boxRoundness)
        const voxelEdgeMaterial = new THREE.LineBasicMaterial({ color: '#3c3c3c', opacity: transparent });
        const voxelMaterial = new THREE.MeshBasicMaterial({ color: this.color, opacity: transparent, transparent: true });

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, voxelEdgeMaterial.clone());
        line.position.copy(pointCenter)


        const voxelBlock = new THREE.Mesh(geometry, voxelMaterial.clone());
        voxelBlock.position.copy(pointCenter);
        voxelBlock.applyMatrix4(line.matrixWorld.clone())
        voxelBlock.updateMatrix()
        voxelBlock.updateMatrixWorld()
        voxelBlock.geometry.computeBoundingBox()
        voxelBlock.geometry.computeBoundingSphere()


        const mergedObject = new THREE.Object3D();
        mergedObject.add(line)
        mergedObject.add(voxelBlock)

        return mergedObject;
    }
}


export class ModelElement {
    // @ts-ignore
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
            console.log('concrete info', concrete)
            concrete.computeBoundingBox();
            concrete.computeBoundingSphere();

            concrete.geometry.computeBoundingBox()
            concrete.geometry.computeBoundingSphere()

            if (concrete.boundingBox) {
                concrete.geometry.boundingBox = concrete.boundingBox.clone()
                const boundingSphere = new THREE.Sphere();
                concrete.boundingBox.clone().getBoundingSphere(boundingSphere);
                concrete.geometry.boundingSphere = boundingSphere

                concrete.geometry.attributes.normal.needsUpdate = true;
                concrete.geometry.attributes.position.needsUpdate = true;
            }

            const objectBoundingBox = new THREE.Box3().setFromObject(concrete);
            this.boundingBoxConcrete.union(objectBoundingBox);

            // @ts-ignore
            concrete.convertGeometry = this.renderConvertGeometry(concrete);
        }

        const size = new THREE.Vector3();
        this.boundingBoxConcrete.getSize(size)
        this.concreteVolume = size.x * size.y * size.z;

        for (const rebar of this.reinforcingBarList) {
            rebar.computeBoundingBox();
            rebar.computeBoundingSphere();

            rebar.geometry.computeBoundingBox()
            rebar.geometry.computeBoundingSphere()

            if (rebar.boundingBox) {
                rebar.geometry.boundingBox = rebar.boundingBox.clone()
                const boundingSphere = new THREE.Sphere();
                rebar.boundingBox.clone().getBoundingSphere(boundingSphere);
                rebar.geometry.boundingSphere = boundingSphere

                rebar.geometry.attributes.normal.needsUpdate = true;
                rebar.geometry.attributes.position.needsUpdate = true;
            }

            // @ts-ignore
            rebar.convertGeometry = this.renderConvertGeometry(rebar);
        }
    }

    private renderConvertGeometry(mesh: FragmentMesh) {
        const convertGeometry =  mesh.geometry.clone();
        const instanceMatrix = mesh.instanceMatrix.array;
        const numInstances = instanceMatrix.length / 16;
        for (let i = 0; i < numInstances; i++) {
            const instanceIndex = i * 16;
            const matrix = new THREE.Matrix4();
            matrix.fromArray(instanceMatrix.slice(instanceIndex, instanceIndex + 16));

            convertGeometry.attributes.position.applyMatrix4(matrix);
            convertGeometry.attributes.position.needsUpdate = true;

            convertGeometry.attributes.normal = mesh.geometry.attributes.normal.clone();
            convertGeometry.attributes.normal.applyMatrix4(matrix);
            convertGeometry.attributes.normal.needsUpdate = true;
        }
        convertGeometry.computeBoundingBox()
        convertGeometry.computeBoundingSphere()

        // @ts-ignore
        convertGeometry.boundsTree = new MeshBVH(convertGeometry);
        return  convertGeometry;
    }
}