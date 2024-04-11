import * as THREE from 'three';
import * as OBC from 'openbim-components';
import {fileToUint8Array} from "../utils/file.ts";
import {Fragment} from "bim-fragment";
import {CommonLoader} from "./common-loader.ts";
import {ModelHandler} from "./model-handler.ts";

export class ModelSetting {
    public gridSize: number;
    public boxSize: number;
    public boxRoundness: number;

    constructor() {
        this.gridSize = 0.3;
        this.boxSize = 0.3;
        this.boxRoundness = 0.01;
    }
}

export class ModelLoader extends CommonLoader {
    private _file: File | null;
    private _handle: ModelHandler
    public settings: ModelSetting

    constructor(container : HTMLDivElement, file: File) {
        super(container)
        this._file = file;
        this._handle = new ModelHandler(this)
        this.settings = new ModelSetting()
    }

    public async cleanUp() {
        await super.cleanUp()
        if (this._file) {
            this._file = null;
        }
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
            this._loader = new OBC.FragmentIfcLoader(this._components)
            await this._loader.setup(this._settings)
            const buffer = await fileToUint8Array(this._file)
            this._groupModel = await this._loader.load(buffer, true)
            await this.settingFirstGroupModel();
            this._scene.get().add(this._groupModel);
            console.log('-------------- model', this._groupModel)
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
            this._camera?.controls.setLookAt(bbox.max.x*2, bbox.max.y*2, bbox.max.z*2,0,0,0)

            const light = new THREE.PointLight(0xffffff, 1);
            light.position.set(bbox.max.x*2, bbox.max.y*2, bbox.max.z*2);
            this._scene?.get().add(light);

            const light2 = new THREE.PointLight(0xffffff, 1);
            light2.position.set(bbox.max.x*-2, bbox.max.y*-2, bbox.max.z*-2);
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

    public async voxelizeModel() {
        return await this._handle.voxelizeModel()
    }
}