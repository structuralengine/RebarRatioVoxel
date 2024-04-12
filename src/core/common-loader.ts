import {IfcFragmentSettings} from "openbim-components/src/fragments/FragmentIfcLoader/src";
import * as THREE from "three";
import * as OBC from "openbim-components";
import {FragmentsGroup} from "bim-fragment";
import {CullerUpdater} from "./culler-updater.ts";

export class CommonLoader {
    protected _container: HTMLDivElement;
    protected _settings: IfcFragmentSettings;
    protected _components: OBC.Components;
    protected _tools: OBC.ToolComponent;
    protected _scene?: OBC.SimpleScene;
    protected _renderer?: OBC.SimpleRenderer;
    protected _camera?: OBC.SimpleCamera;
    protected _raycaster?: OBC.SimpleRaycaster;
    protected _loader?: OBC.FragmentIfcLoader;
    protected _groupModel?: FragmentsGroup;
    protected _cullerUpdate: CullerUpdater

    constructor(container : HTMLDivElement) {
        this._components = new OBC.Components();
        this._tools = this._components.tools
        this._container = container;

        this._cullerUpdate = new CullerUpdater()
        this._cullerUpdate.init(this._components);

        this._settings = new IfcFragmentSettings();
        this._settings.autoSetWasm = true;
    }

    public getModel() {
        return this._groupModel;
    }

    public getScene() {
        return this._scene;
    }

    public getRaycaster() {
        return this._raycaster;
    }

    protected async cleanUp() {
        try {
            const materialManager = this._components.tools.get(OBC.MaterialManager);
            await materialManager?.dispose()

            await this._camera?.dispose()
            await this._scene?.dispose()
            await this._renderer?.dispose()
            await this._raycaster?.dispose()
            await this._loader?.dispose()

            const map = this._components.tools.get(OBC.MiniMap);
            await map?.dispose()

            const navCube = this._components.tools.get(OBC.CubeMap);
            await navCube?.dispose()

            await this._components.ui?.dispose()
            await this._components?.dispose()

        } catch (err) {
            console.error('error dispose components', err)
        }

    }

    protected async setup(): Promise<boolean>{
        try {
            this._scene = this._components.scene = new OBC.SimpleScene(this._components);
            this._renderer = this._components.renderer = new OBC.SimpleRenderer(this._components, this._container);
            this._camera = this._components.camera = new OBC.SimpleCamera(this._components);
            this._raycaster = this._components.raycaster = new OBC.SimpleRaycaster(this._components);
            this._renderer.get().setSize(window.innerWidth, window.innerHeight)
            await this._components.init();
            await this.setupTool();
            this._camera.get().lookAt(0, 0, 0);
            return true;
        } catch (err) {
            console.error(err)
            return false
        }
    }

    private async setupTool() {
        const mainToolbar = new OBC.Toolbar(this._components, {
            name: "toc-editor-main-tooblar",
            position: "bottom",
        });
        this._components.ui.addToolbar(mainToolbar);

        const fragments = new OBC.FragmentManager(this._components);

        const culler = new OBC.ScreenCuller(this._components);
        await culler.setup()

        new OBC.SimpleGrid(this._components)
        const hider = new OBC.FragmentHider(this._components);
        const classifier = new OBC.FragmentClassifier(this._components);
        const spaces = classifier.find({entities: ["IFCSPACE"]});
        hider.set(true, spaces);

        const clipper = this._components.tools.get(OBC.EdgesClipper);
        clipper.enabled = true;

        const map = this._components.tools.get(OBC.MiniMap);
        const mapCanvas = map.uiElement.get("canvas");
        mapCanvas.domElement.style.bottom = "5rem";

        this._components.ui.add(mapCanvas);
        map.lockRotation = false;
        map.zoom = 0.2;
        map.frontOffset = 4;

        const modelTree = new OBC.FragmentTree(this._components);
        modelTree.init();
        mainToolbar.addChild(modelTree.uiElement.get("main"));

        const highlighter = this._components.tools.get(OBC.FragmentHighlighter);
        await highlighter.setup();

        const plans = new OBC.FragmentPlans(this._components);
        mainToolbar.addChild(plans.uiElement.get("main"));

        const whiteMaterial = new THREE.MeshBasicMaterial();
        const materialManager = new OBC.MaterialManager(this._components);
        materialManager.addMaterial("white", whiteMaterial);

        const styler = new OBC.FragmentClipStyler(this._components);
        await styler.setup();
        mainToolbar.addChild(styler.uiElement.get("mainButton"));

        const propsProcessor = new OBC.IfcPropertiesProcessor(this._components);
        mainToolbar.addChild(propsProcessor.uiElement.get("main"));

        this._renderer?.get().domElement.addEventListener("wheel", this._cullerUpdate.update);
        this._camera?.controls.addEventListener("controlstart", this._cullerUpdate.cancel);
        this._camera?.controls.addEventListener("wake", this._cullerUpdate.cancel);
        this._camera?.controls.addEventListener("controlend", this._cullerUpdate.update);
        this._camera?.controls.addEventListener("sleep", this._cullerUpdate.update);

        highlighter.events.select.onClear.add(() => {
            propsProcessor.cleanPropertiesList();
        });

        highlighter.events.select.onHighlight.add((selection) => {
            const fragmentID = Object.keys(selection)[0];
            const firstID = Array.from(selection[fragmentID])[0];
            const expressID = Number(firstID);
            let model;
            for (const group of fragments.groups) {
                const fragmentFound = Object.values(group.keyFragments).find(
                    (id) => id === fragmentID
                );
                if (fragmentFound) {
                    model = group;
                }
            }
            if (model) {
                propsProcessor.renderProperties(model, expressID);
            }
        });

        const dimensions = this._components.tools.get(OBC.LengthMeasurement);

        window.addEventListener("keydown", (event) => {
            if(event.code === "Escape") {
                dimensions.cancelCreation();
                dimensions.enabled = false;
            }
        })

        const propsManager = new OBC.IfcPropertiesManager(this._components);
        propsManager.wasm = {...this._settings.wasm}
        propsProcessor.propertiesManager = propsManager;

        const exploder = new OBC.FragmentExploder(this._components);
        mainToolbar.addChild(exploder.uiElement.get("main"));

        const navCube = this._components.tools.get(OBC.CubeMap);
        navCube.setPosition("bottom-left");
        navCube.offset = 0.5;

        plans.onNavigated.add(() => {
            map.enabled = false;
            navCube.visible = false;

            materialManager.setBackgroundColor(new THREE.Color('white'));
            materialManager.set(true, ["white"]);
        });

        plans.onExited.add(() => {
            map.enabled = true;
            navCube.visible = true;
            materialManager.resetBackgroundColor();
            materialManager.set(false, ["white"]);
        });
    }
}