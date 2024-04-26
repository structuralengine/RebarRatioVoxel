import * as THREE from "three";
import {ModelLoader} from "./model-loader.ts";
import {FragmentMesh} from "bim-fragment";
import {MeshBVH} from "three-mesh-bvh";
import {mergeGeometries} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

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
        this.transparent = transparent;
        this.color = defaultColor;
        this.mesh = this.createVoxelMesh(center, boxSize, boxRoundness, transparent);
        this.id = this.mesh.uuid;
        this.reBarList = [];
    }

    public createVoxelMesh(pointCenter: THREE.Vector3, boxSize: number, boxRoundness: number = 0, transparent: number): THREE.Object3D {
        const geometry = new RoundedBoxGeometry(boxSize, boxSize, boxSize, 0.1, boxRoundness)
        // const geometry = new BoxGeometry(boxSize, boxSize, boxSize)
        geometry.computeBoundingBox()
        geometry.computeBoundingSphere()

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
    private _concreteList: FragmentMesh[];
    public concreteVolume: number;
    private _reinforcingBarList: FragmentMesh[];
    public boundingBoxConcrete?: THREE.Box3;
    public voxelModelData: VoxelModelData[]
    public voxelHasRebar: VoxelModelData[]
    public voxelHasNotRebar: VoxelModelData[]

    public concreteMesh?: THREE.Mesh;
    public reinforcingBarMesh?: THREE.Mesh;

    constructor(modelLoader: ModelLoader) {
        this._modelLoader = modelLoader;
        this._concreteList = [];
        this.concreteVolume = 0;
        this._reinforcingBarList = [];
        this.voxelModelData = [];
        this.voxelHasRebar = [];
        this.voxelHasNotRebar = [];
    }

    public cleanUp() {
        this._concreteList = []
        this._reinforcingBarList = []
        this.voxelModelData = []
        this.voxelHasRebar = []
        this.voxelHasNotRebar = []
    }

    set concreteList(list: any[]) {
        this._concreteList = list;
    }

    get concreteList() {
        return this._concreteList;
    }

    set reinforcingBarList(list: any[]) {
        this._reinforcingBarList = list;
    }

    get reinforcingBarList() {
        return this._reinforcingBarList;
    }

    public setup() {
        const concreteGeoList = []
        this.boundingBoxConcrete = new THREE.Box3();
        for (const concrete of this._concreteList) {
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

            concreteGeoList.push(this.renderConvertGeometry(concrete))
        }

        if (concreteGeoList.length > 0) {
            const alConcreteGeometry = mergeGeometries(concreteGeoList)
            alConcreteGeometry.computeBoundingBox()
            alConcreteGeometry.computeBoundingSphere()
            // @ts-ignore
            alConcreteGeometry.boundsTree = new MeshBVH(alConcreteGeometry);
            this.concreteMesh = new THREE.Mesh(alConcreteGeometry,  new THREE.MeshMatcapMaterial({color: '#ffffff'}))
        }

        const size = new THREE.Vector3();
        this.boundingBoxConcrete.getSize(size)
        this.concreteVolume = size.x * size.y * size.z;

        const rebarGeoList = []
        for (const rebar of this._reinforcingBarList) {
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

            rebarGeoList.push(this.renderConvertGeometry(rebar))
        }

        if (rebarGeoList.length > 0) {
            const alReBarGeometry = mergeGeometries(rebarGeoList)
            alReBarGeometry.computeBoundingBox()
            alReBarGeometry.computeBoundingSphere()
            // @ts-ignore
            alReBarGeometry.boundsTree = new MeshBVH(alReBarGeometry);
            this.reinforcingBarMesh = new THREE.Mesh(alReBarGeometry, new THREE.MeshMatcapMaterial({color: '#ffffff'}))
        }

    }

    private renderConvertGeometry(mesh: FragmentMesh) {
        const geometries = [];
        const dummy = new THREE.Object3D();

        for (let i = 0; i < mesh.count; i++) {
            const geometry = mesh.geometry.clone();
            mesh.getMatrixAt(i, dummy.matrix);
            geometry.applyMatrix4(dummy.matrix);
            geometries.push(geometry);
        }

        return  mergeGeometries(geometries);
    }
}