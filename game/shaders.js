const perVertexVertexShader1 = `#version 300 es

layout (location = 0) in vec4 aPosition;
layout (location = 3) in vec2 aTexCoord;

uniform mat4 uModelViewProjection;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = uModelViewProjection * aPosition;
    //gl_Position = uProjectionMatrix * (uViewMatrix * vec4(surfacePosition, 1));
}
`;

const perVertexFragmentShader1 = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseColorTexture;
uniform vec4 uBaseColorFactor;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec4 baseColor = texture(uBaseColorTexture, vTexCoord);
    oColor = uBaseColorFactor * baseColor;
}
`;

//NEW CODE
const perVertexVertexShader = `#version 300 es
layout (location = 0) in vec4 aPosition;
layout (location = 3) in vec2 aTexCoord;
layout (location = 1) in vec3 aNormal;

uniform mat4 uModelViewProjection;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec3 uCameraPosition;

struct Light {
    vec3 position;
    vec3 attenuation;
    vec3 color;
};
struct Material {
    float diffuse;
    float specular;
    float shininess;
};

uniform Light uLight;
uniform Material uMaterial;

out vec2 vTexCoord;
out vec3 vDiffuseLight;
out vec3 vSpecularLight;

void main() {
    //float d = distance(surfacePosition, uLight.position);
    //float attenuation = 1.0 / dot(uLight.attenuation, vec3(1, d, d * d));
    
    //vec3 N = normalize(mat3(uModelMatrix) * aNormal);
    //vec3 L = normalize(uLight.position - surfacePosition);
    //vec3 E = normalize(uCameraPosition - surfacePosition);
    //vec3 R = normalize(reflect(-L, N));

    //float lambert = max(0.0, dot(L, N)) * uMaterial.diffuse;
    //float phong = pow(max(0.0, dot(E, R)), uMaterial.shininess) * uMaterial.specular;

    //vDiffuseLight = lambert * attenuation * uLight.color;
    //vSpecularLight = phong * attenuation * uLight.color;
    vTexCoord = aTexCoord;
    gl_Position = uModelViewProjection * aPosition;
    //gl_Position = uProjectionMatrix * (uViewMatrix * vec4(surfacePosition, 1));
}
`;

const perVertexFragmentShader = `#version 300 es

precision mediump float;

uniform mediump sampler2D uTexture;

in vec2 vTexCoord;
in vec3 vDiffuseLight;
in vec3 vSpecularLight;

out vec4 oColor;

void main() {
    const float gamma = 2.2;
    vec3 albedo = pow(texture(uTexture, vTexCoord).rgb, vec3(gamma));
    vec3 finalColor = albedo * vDiffuseLight + vSpecularLight;
    oColor = pow(vec4(finalColor, 1), vec4(1.0 / gamma));
}
`;

export const shaders = {
    perVertex: {
        vertex: perVertexVertexShader,
        fragment: perVertexFragmentShader1,
    },
};

/*export const shaders = {
    simple: {perVertexVertexShader, perVertexFragmentShader}
}*/
