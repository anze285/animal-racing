const perVertexVertexShader = `#version 300 es
layout (location = 0) in vec4 aPosition;
layout (location = 3) in vec2 aTexCoord;
layout (location = 1) in vec3 aNormal;

uniform mat4 uModelViewProjection;
uniform mat4 uMatrix;


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

uniform mat4 uViewModel;
uniform mat4 uProjection;

out vec2 vTexCoord;
out vec3 vDiffuseLight;
out vec3 vSpecularLight;


void main() {
    vec3 surfacePosition = (uModelViewProjection * vec4(aPosition)).xyz;
    
    float d = distance(surfacePosition, uLight.position);
    float attenuation = 1.0 / dot(uLight.attenuation, vec3(1, d, d*d));

    vec3 N = normalize(mat3(uModelViewProjection) * normalize(aNormal).xyz).xyz;
    vec3 L = normalize(uLight.position - surfacePosition);
    vec3 E = normalize(uCameraPosition - surfacePosition);
    vec3 R = normalize(reflect(-L, N));

    float lambert = max(0.3, dot(L, N)) * uMaterial.diffuse;
    float phong = pow(max(0.2, dot(E, R)), uMaterial.shininess) * uMaterial.specular;


    vDiffuseLight = lambert * attenuation * uLight.color;
    vSpecularLight = phong * attenuation * uLight.color;

    vTexCoord = aTexCoord;
    gl_Position = uModelViewProjection * aPosition;
}
`;

const perVertexFragmentShader = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseColorTexture;
uniform vec4 uBaseColorFactor;

in vec2 vTexCoord;
in vec3 vDiffuseLight;
in vec3 vSpecularLight;

out vec4 oColor;

void main() {
    const float gamma = 2.2;
    vec4 baseColor = texture(uBaseColorTexture, vTexCoord);
    vec3 albedo = pow(texture(uBaseColorTexture, vTexCoord).rgb, vec3(gamma));
    vec3 finalColor = albedo * vDiffuseLight * vSpecularLight;
    oColor = pow(vec4(finalColor, 1), vec4(1.0 / gamma));
}
`;
/*const perVertexFragmentShader = `#version 300 es

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
`;*/

export const shaders = {
    perVertex: {
        vertex: perVertexVertexShader,
        fragment: perVertexFragmentShader,
    },
};
