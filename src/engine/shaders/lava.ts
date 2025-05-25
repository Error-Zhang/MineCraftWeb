export const lavaVertexShader = `
    precision highp float;

    // Attributes
    attribute vec3 position;
    attribute vec2 uv;
    attribute vec3 normal;

    // Uniforms
    uniform mat4 world;
    uniform mat4 worldView;
    uniform mat4 worldViewProjection;
    uniform float time;
    uniform float flowSpeed;

    // Varying
    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main(void) {
        vUV = uv;
        vNormal = normal;
        
        // 计算岩浆流动效果
        float flow = sin(position.x * 3.0 + time * flowSpeed) * 
                    cos(position.z * 3.0 + time * flowSpeed) * 0.1;
        
        vec3 newPosition = position;
        newPosition.y += flow;
        
        vPosition = (world * vec4(newPosition, 1.0)).xyz;
        gl_Position = worldViewProjection * vec4(newPosition, 1.0);
    }
`;

export const lavaFragmentShader = `
    precision highp float;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vPosition;

    uniform sampler2D diffuseSampler;
    uniform float time;
    uniform float glowIntensity;

    void main(void) {
        // 基础颜色
        vec4 color = texture2D(diffuseSampler, vUV);
        
        // 添加发光效果
        float glow = sin(time * 2.0) * 0.5 + 0.5;
        color.rgb += vec3(1.0, 0.3, 0.0) * glow * glowIntensity;
        
        // 添加边缘光效果
        vec3 normal = normalize(vNormal);
        float rim = 1.0 - max(0.0, dot(normal, vec3(0.0, 0.0, 1.0)));
        rim = pow(rim, 2.0);
        color.rgb += vec3(1.0, 0.3, 0.0) * rim * 0.5;
        
        gl_FragColor = color;
    }
`; 