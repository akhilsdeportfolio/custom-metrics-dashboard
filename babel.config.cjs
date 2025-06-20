module.exports = function(api) {
  // Cache the returned value forever and don't call this function again
  api.cache(true);

  const ReactCompilerConfig = {
    target: '18' // Target React 18
  };

  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      '@babel/preset-react'
    ],
    plugins: [
      ['babel-plugin-react-compiler', ReactCompilerConfig]
    ]
  };
};
