import {
    Scene,
    Vector3,
    Color3,
    MeshBuilder,
    StandardMaterial,
    DynamicTexture
} from "@babylonjs/core";

export class DebugHelper {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    // 可视化射线
    drawRay(origin: Vector3, direction: Vector3, length = 5, color = Color3.Red()) {
        const rayEnd = origin.add(direction.normalize().scale(length));
        const lines = MeshBuilder.CreateLines("rayDebug", {
            points: [origin, rayEnd]
        }, this.scene);
        lines.color = color;

        // 一定时间后销毁
        //setTimeout(() => lines.dispose(), 1000);
    }

    // 标记一个坐标点
    markPoint(pos: Vector3, color = Color3.Green(), size = 0.1) {
        const sphere = MeshBuilder.CreateSphere("marker", {diameter: size}, this.scene);
        sphere.position = pos.clone();

        const mat = new StandardMaterial("markerMat", this.scene);
        mat.emissiveColor = color;
        sphere.material = mat;

        //setTimeout(() => sphere.dispose(), 1000);
    }

    /**
     * 生成xyz轴线
     * @param scene
     * @param size
     */
    createAxisHelper(size = 16): void {
        const scene = this.scene;
        const makeTextPlane = (text: string, color: string, position: Vector3)=> {
            const dynamicTexture = new DynamicTexture("DynamicTexture", 64, scene, true);
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);

            const plane = MeshBuilder.CreatePlane("TextPlane", { size: 0.5 }, scene);
            const mat = new StandardMaterial("TextPlaneMaterial", scene);
            mat.diffuseTexture = dynamicTexture;
            mat.backFaceCulling = false;

            plane.material = mat;
            plane.position = position;

            return plane;
        };

        // X Axis - Red
        const axisX = MeshBuilder.CreateLines("axisX", {
            points: [Vector3.Zero(), new Vector3(size, 0, 0)]
        }, scene);
        axisX.color = Color3.Red();
        makeTextPlane("X", "red", new Vector3(size, 0, 0));

        // Y Axis - Green
        const axisY = MeshBuilder.CreateLines("axisY", {
            points: [Vector3.Zero(), new Vector3(0, size, 0)]
        }, scene);
        axisY.color = Color3.Green();
        makeTextPlane("Y", "green", new Vector3(0, size, 0));

        // Z Axis - Blue
        const axisZ = MeshBuilder.CreateLines("axisZ", {
            points: [Vector3.Zero(), new Vector3(0, 0, size)]
        }, scene);
        axisZ.color = Color3.Blue();
        makeTextPlane("Z", "blue", new Vector3(0, 0, size));
    }
}

