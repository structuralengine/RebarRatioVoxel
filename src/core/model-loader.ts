import * as THREE from 'three';
import * as OBC from 'openbim-components';
import { fileToUint8Array } from "../utils/file.ts";
import { Fragment, FragmentMesh } from "bim-fragment";
import { CommonLoader } from "./common-loader.ts";
import { ModelHandler } from "./model-handler.ts";
import { IFCBUILDINGELEMENTPROXY, IFCREINFORCINGBAR } from "web-ifc";
import {ModelElement, VoxelModelData} from "./model-element.ts";
import { add } from 'three/examples/jsm/libs/tween.module.js';
export const defaultVolume = 300;
export const defaultGridSize = 0.5;

export class ModelSetting {
    public gridSize: number;
    public boxSize: number;
    public boxRoundness: number;
    public minSizeLimit: number;

    constructor() {
        this.gridSize = defaultGridSize;
        this.boxSize = defaultGridSize;
        this.boxRoundness = 0.01;
        this.minSizeLimit = defaultGridSize;
    }

    setup(volume: number) {
        const newSize = this.calculateScale(volume);
        this.gridSize = newSize;
        this.boxSize = newSize;
        this.minSizeLimit = newSize;
    }

    setupSetting(setting: any) {
        this.gridSize = setting.gridSize
        this.boxSize = setting.boxSize
        this.boxRoundness = setting.boxRoundness
    }

    private calculateScale(volume: number) {
        const volumeScaleMap = [
            { volume: 300, scale: 0.4 },
            { volume: 1000, scale: 0.5 },
            { volume: 2000, scale: 0.6 },
            { volume: 3000, scale: 0.7 },
            { volume: 4000, scale: 0.8 },
            { volume: 5000, scale: 0.9 },
            { volume: 7000, scale: 1 },
            { volume: 10000, scale: 1.1 },
            { volume: 12000, scale: 1.2 },
            { volume: 15000, scale: 1.3 },
            { volume: 20000, scale: 1.4 },
            { volume: 25000, scale: 1.5 }
        ];
        let scale = 1;
        for (let i = 0; i < volumeScaleMap.length; i++) {
            const entry = volumeScaleMap[i];
            if (volume <= entry.volume) {
                scale = entry.scale;
                break;
            }
        }
        return scale;
    }
}

export class ModelLoader extends CommonLoader {
    private _file: File | null;
    private _handle: ModelHandler
    public settings: ModelSetting
    private _absoluteMax: THREE.Vector3;
    private _absoluteMin: THREE.Vector3;
    private _elements: ModelElement;
    private _visibleVoxel: boolean;
    public _callBack: (value: boolean) => void;
    public _cleanViewer: () => void;

    constructor(container: HTMLDivElement, file: File, callBack: (value: boolean) => void, cleanUpViewer: () => void) {
        super(container)
        this._file = file;
        this._handle = new ModelHandler(this)
        this.settings = new ModelSetting()
        this._elements = new ModelElement(this)
        this._absoluteMax = new THREE.Vector3();
        this._absoluteMin = new THREE.Vector3();
        this._callBack = callBack
        this._cleanViewer = cleanUpViewer
        this._visibleVoxel = true
    }

    public getElement() {
        return this._elements;
    }

    public getSetting() {
        return this.settings;
    }

    public reSetupLoadModel() {
        this._handle.reSetupVoxel()
    }

    public async cleanUp() {
        await super.cleanUp()
        if (this._file) {
            this._file = null;
        }
        this._elements?.cleanUp();
        this._handle?.cleanUp();
    }

    public async setup(): Promise<boolean> {
        try {
            const isOk = await super.setup()
            if (isOk) {
                await this.loadModel();
                return true;
            }
            return false;
        } catch (err) {
            console.error(err)
            return false
        }
    }

    private async loadModel() {
        if (this._file && this._scene) {
            const mainToolbar = new OBC.Toolbar(this._components, {
                name: "toc-editor-main-tooblar",
                position: "bottom",
            });
            const voxelButton = new OBC.Button(this._components)
            voxelButton.materialIcon = 'apps'
            voxelButton.tooltip = 'Voxelize'
            voxelButton.onClick.add(() => {
                this._visibleVoxel = !this._visibleVoxel
                this._callBack(!this._visibleVoxel)
            })
            const closeModelButton = new OBC.Button(this._components)
            closeModelButton.materialIcon = 'cancel'
            closeModelButton.tooltip = 'Close model'
            closeModelButton.onClick.add(() => {
                this._cleanViewer()
                this._visibleVoxel = false
                this._callBack(false)
            })
            mainToolbar.addChild(voxelButton)
            mainToolbar.addChild(closeModelButton)
            this._components.ui.addToolbar(mainToolbar)
            this._loader = new OBC.FragmentIfcLoader(this._components)
            await this._loader.setup(this._settings)
            const buffer = await fileToUint8Array(this._file)
            this._groupModel = await this._loader.load(buffer, true)
            this._groupModel.items.forEach((item: Fragment) => {
                item.mesh.computeBoundingSphere()
                item.mesh.computeBoundingBox()
            })
            console.log('groupModel', this._groupModel)
            this._groupModel.items.map((item: Fragment) => {
                {
                    this.getBoudingBoxFormMesh(item.mesh)
                }
            })

            await this.settingFirstGroupModel();
            await this.filterReinforcingBar();

            await this._handle.voxelizeModel();
        }
    }

    private async settingFirstGroupModel() {
        if (this._groupModel) {
            const materialManager = this._tools.get(OBC.MaterialManager);
            const meshes = this._groupModel.items.map((frag: Fragment) => frag.mesh);
            materialManager.addMeshes('white', meshes);
            materialManager.set(true, ["white"]);

            // set up grid and camera
            const grid = this._tools.get(OBC.SimpleGrid);
            const bbox = new THREE.Box3().setFromObject(this._groupModel);
            const bottom = bbox.min.y;
            const threeGrid = grid.get();
            threeGrid.position.set(threeGrid.position.x, bottom, threeGrid.position.z)
            this._camera?.controls.setLookAt(bbox.max.x * 2, bbox.max.y * 2, bbox.max.z * 2, 0, 0, 0)

            const light = new THREE.PointLight(0xffffff, 1);
            light.position.set(bbox.max.x * 2, bbox.max.y * 2, bbox.max.z * 2);
            this._scene?.get().add(light);

            const light2 = new THREE.PointLight(0xffffff, 1);
            light2.position.set(bbox.max.x * -2, bbox.max.y * -2, bbox.max.z * -2);
            this._scene?.get().add(light2);

            // set up high lighter
            const highlighter = this._tools.get(OBC.FragmentHighlighter);
            await highlighter.updateHighlight();

            // set up styler
            const styler = this._tools.get(OBC.FragmentClipStyler);
            await styler.update();

            // set up classifier
            const classifier = this._tools.get(OBC.FragmentClassifier);
            classifier.byStorey(this._groupModel);
            classifier.byEntity(this._groupModel);

            // set up hider
            const hider = this._tools.get(OBC.FragmentHider);
            await hider.update();

            // set up properties processor
            const propsProcessor = this._tools.get(OBC.IfcPropertiesProcessor);
            await propsProcessor.process(this._groupModel)

            // set up fragment plans
            const plans = this._tools.get(OBC.FragmentPlans);
            await plans.computeAllPlanViews(this._groupModel);
            await plans.updatePlansList();

            await this._cullerUpdate.update()
        }
    }

    public showVoxelModel() {
        this._handle.renderVoxelModel()
    }

    public hideVoxelModel() {
        this._handle.renderVoxelModel(false)
    }
    
    public async filterReinforcingBar() {
        if (this._groupModel) {
            const proProxies = await this._groupModel?.getAllPropertiesOfType(IFCBUILDINGELEMENTPROXY)
            if (proProxies) {
                const valueOfObjects = Object.values(proProxies)
                const expressIDArray = valueOfObjects.map((d) => d.expressID)
                const fragmentIdList = this._groupModel.getFragmentMap(expressIDArray);
                const idKeys = Object.keys(fragmentIdList)
                this._elements.concreteList = this._groupModel.children.filter((f) => idKeys.find(id => id === f.uuid) !== undefined) as FragmentMesh[]
                this._elements.reinforcingBarList = this._groupModel.children.filter((f) => idKeys.find(id => id === f.uuid) === undefined) as FragmentMesh[]
                this._elements.setup();
                this.settings.setup(this._elements.concreteVolume);
            }
        }
    }

    public getBoundingBox() {
        return new THREE.Box3(
            this._absoluteMin,
            this._absoluteMax
        )
    }

    private getBoudingBoxFormMesh(mesh: FragmentMesh) {
        if (!mesh.geometry.index) {
            return;
        }

        const bbox = this.getFragmentBounds(mesh);

        mesh.updateMatrixWorld();
        const meshTransform = mesh.matrixWorld;

        const instanceTransform = new THREE.Matrix4();
        const isInstanced = mesh instanceof THREE.InstancedMesh;
        const count = isInstanced ? mesh.count : 1;

        for (let i = 0; i < count; i++) {
            const min = bbox.min.clone();
            const max = bbox.max.clone();

            if (isInstanced) {
                mesh.getMatrixAt(i, instanceTransform);
                min.applyMatrix4(instanceTransform);
                max.applyMatrix4(instanceTransform);
            }

            min.applyMatrix4(meshTransform);
            max.applyMatrix4(meshTransform);

            if (min.x < this._absoluteMin.x) this._absoluteMin.x = min.x;
            if (min.y < this._absoluteMin.y) this._absoluteMin.y = min.y;
            if (min.z < this._absoluteMin.z) this._absoluteMin.z = min.z;

            if (min.x > this._absoluteMax.x) this._absoluteMax.x = min.x;
            if (min.y > this._absoluteMax.y) this._absoluteMax.y = min.y;
            if (min.z > this._absoluteMax.z) this._absoluteMax.z = min.z;

            if (max.x > this._absoluteMax.x) this._absoluteMax.x = max.x;
            if (max.y > this._absoluteMax.y) this._absoluteMax.y = max.y;
            if (max.z > this._absoluteMax.z) this._absoluteMax.z = max.z;

            if (max.x < this._absoluteMin.x) this._absoluteMin.x = max.x;
            if (max.y < this._absoluteMin.y) this._absoluteMin.y = max.y;
            if (max.z < this._absoluteMin.z) this._absoluteMin.z = max.z;
        }
    }

    private getFragmentBounds(mesh: THREE.InstancedMesh | THREE.Mesh) {
        const position = mesh.geometry.attributes.position;

        const maxNum = Number.MIN_VALUE;
        const minNum = -maxNum;
        const min = new THREE.Vector3(maxNum, maxNum, maxNum);
        const max = new THREE.Vector3(minNum, minNum, minNum);

        if (!mesh.geometry.index) {
            throw new Error("Geometry must be indexed!");
        }

        const indices = Array.from(mesh.geometry.index.array);

        for (let i = 0; i < indices.length; i++) {
            if (i % 3 === 0) {
                if (indices[i] === 0 && indices[i + 1] === 0 && indices[i + 2] === 0) {
                    i += 2;
                    continue;
                }
            }

            const index = indices[i];
            const x = position.getX(index);
            const y = position.getY(index);
            const z = position.getZ(index);

            if (x < min.x) min.x = x;
            if (y < min.y) min.y = y;
            if (z < min.z) min.z = z;
            if (x > max.x) max.x = x;
            if (y > max.y) max.y = y;
            if (z > max.z) max.z = z;
        }



        return new THREE.Box3(min, max);
    }

    public showModel(type: number) {
        const scene = this.getScene()?.get();
        const model = this._groupModel;
        if (scene && model) {
            switch (type) {
                case IFCREINFORCINGBAR: {
                    this._elements.reinforcingBarList.forEach((item: FragmentMesh) => {
                        scene.add(item)
                    })
                    break
                }
                case IFCBUILDINGELEMENTPROXY: {
                    this._elements.concreteList.forEach((item: FragmentMesh) => {
                        scene.add(item)
                    })
                    break
                }
            }
        }
    }

    public removeModel(type: number) {
        const scene = this.getScene()?.get();
        const model = this._groupModel;
        if (scene && model) {
            switch (type) {
                case IFCREINFORCINGBAR: {
                    this._elements.reinforcingBarList.forEach((item: FragmentMesh) => {
                        scene.remove(item)
                    })
                    break
                }
                case IFCBUILDINGELEMENTPROXY: {
                    this._elements.concreteList.forEach((item: FragmentMesh) => {
                        scene.remove(item)
                    })
                    break
                }
            }
        }
    }

    public showVoxelByColor(type: number) {
        const scene = this.getScene()?.get();
        const modelElement = this.getElement();
        if (scene && modelElement) {
            const filteredVoxels = modelElement.voxelModelData.filter(voxel => voxel.mesh.children[1].material.color.getHex() === type);
            filteredVoxels.forEach(voxel => {
                scene.add(voxel.mesh);
            });
        }
    }

    public hideVoxelByColor(type: number) {
        const scene = this.getScene()?.get();
        const modelElement = this.getElement();
        if (scene && modelElement) {
            const filteredVoxels = modelElement.voxelModelData.filter(voxel => voxel.mesh.children[1].material.color.getHex() === type);
            filteredVoxels.forEach(voxel => {
                scene.remove(voxel.mesh);
            });
        }
    }
}