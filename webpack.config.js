module.exports = {
    entry: "./src/entry.js",
    output: {
        filename: "public/index.js"
    },
    module: {
        loaders: [
            { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: "url?limit=17179869184" },
            { test: /\.css$/, loader: "style!css" }
        ]
    }
};
