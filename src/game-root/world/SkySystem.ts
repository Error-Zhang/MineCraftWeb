import {ShaderMaterial, MeshBuilder, Mesh, Scene, Vector3, Tools, Effect} from "@babylonjs/core";

class SkySystem {
    private skyMesh: Mesh;
    private material: ShaderMaterial | undefined;

    constructor(scene: Scene) {
        // 创建一个大球体作为天空
        this.skyMesh = MeshBuilder.CreateSphere("sky", { diameter: 1000, segments: 32 }, scene);
        this.skyMesh.infiniteDistance = true;
        this.skyMesh.rotation.x = Math.PI; // 使纹理朝上
        // 加载 vertex shader
        Tools.LoadFile("/shaders/skyVertex.glsl", (vertexShader) => {
            Effect.ShadersStore["skyVertexShader"] = vertexShader as string;

            // 加载 fragment shader
            Tools.LoadFile("/shaders/skyFragment.glsl", (fragmentShader) => {
                Effect.ShadersStore["skyFragmentShader"] = fragmentShader as string;

                this.material = new ShaderMaterial("skyShader", scene, {
                    vertex: "sky",
                    fragment: "sky",
                }, {
                    attributes: ["position"],
                    uniforms: ["worldViewProjection", "sunDir", "timeOfDay"]
                });

                this.skyMesh.material = this.material;
                this.skyMesh.material.backFaceCulling = false; // 显示内表面
            });
        });
    }


    private sunDirection = new Vector3();
    private currentTime: number = 0; // 累积时间，范围 [0, 1)
    private timeSpeed = 0.01; // 控制白天流逝速度（1 表示 1 秒一轮，0.01 表示 100 秒一轮）

    update(deltaTime: number) {
        if (!this.material) return;
        // 持续推进时间
        this.currentTime += deltaTime * this.timeSpeed;
        if (this.currentTime > 1) this.currentTime -= 1;

        // 根据 currentTime 计算太阳角度
        const angle = this.currentTime * Math.PI * 2;
        this.sunDirection.set(Math.cos(angle), Math.sin(angle), 0);

        this.material.setVector3("sunDir", this.sunDirection);
        this.material.setFloat("timeOfDay", this.currentTime);
    }

}
export default SkySystem;