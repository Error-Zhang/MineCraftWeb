precision highp float;

uniform float timeOfDay; // 0 - 1 之间
uniform vec3 sunDir;

// 颜色定义：黎明、白天、黄昏、夜晚
vec3 dawn = vec3(0.8, 0.5, 0.3); // 朝霞、黎明
vec3 day = vec3(0.5, 0.7, 1.0); // 白天
vec3 dusk = vec3(0.9, 0.4, 0.2); // 黄昏
vec3 night = vec3(0.02, 0.02, 0.1); // 夜晚

// 计算天空的颜色，平滑过渡
vec3 getSkyColor(float sunHeight) {
    // 过渡在太阳高度 > 0.2 和 < 0.8 时更平滑
    if (sunHeight > 0.8) {
        // 白天
        return mix(day, dusk, smoothstep(0.8, 1.0, sunHeight));
    } else if (sunHeight > 0.3) {
        // 过渡到黄昏
        return mix(day, dusk, smoothstep(0.3, 0.5, sunHeight));
    } else if (sunHeight > 0.0) {
        // 从黄昏到夜晚
        return mix(dusk, night, smoothstep(0.0, 0.3, sunHeight));
    } else {
        // 夜晚到黎明的过渡
        return mix(night, dawn, smoothstep(-0.2, 0.0, sunHeight)); // -0.2 到 0 让黎明色温过渡更细腻
    }
}

void main() {
    // 计算太阳的高度，太阳的方向与世界上升方向 (0,1,0) 的点积
    float sunHeight = dot(sunDir, vec3(0.0, 1.0, 0.0)); // 基于太阳的方向
    vec3 skyColor = getSkyColor(sunHeight); // 获取过渡后的天空颜色

    gl_FragColor = vec4(skyColor, 1.0); // 设置最终颜色
}
