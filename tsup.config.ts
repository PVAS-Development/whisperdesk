import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    main: 'src/main/index.ts',
    preload: 'src/preload/index.ts',
  },
  outDir: 'dist-electron',
  format: ['cjs'],
  shims: false,
  dts: false,
  splitting: false,
  clean: true,
  external: ['electron'],
  noExternal: ['docx', 'jspdf'], // Bundle these
});
