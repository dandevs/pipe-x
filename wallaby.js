module.exports = () => ({
    files: [
        "tsconfig.json",
        "src/**/*.ts"
    ],

    tests: ["tests/**/*.test.ts"],
    env: { type: "node", runner: "node" },

    testFramework: "jest",
})