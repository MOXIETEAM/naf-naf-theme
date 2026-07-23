#!/usr/bin/env node
// Standalone (sin build, sin dependencias): calcula el clamp() que antes generaban
// fluid()/fluid-type() en src/styles/base/_mixins.scss. Ver docs/css-architecture.md.
// Uso:
//   node tools/fluid.js 20          -> fluid(20)      (padding, gap, width, height...)
//   node tools/fluid.js 16 --type   -> fluid-type(16) (font-size fuera de la escala h1-h6/paragraph)

const REF_W = 1440;
const MIN_W = 990;

function fluid(px) {
  const min = Math.round(px * (MIN_W / REF_W));
  const vw = Math.round((px / REF_W) * 10000) / 100;
  return `clamp(${min}px, ${vw}vw, ${px}px)`;
}

function fluidType(px) {
  const min = Math.round(px * 0.85);
  const vw = Math.round((px / REF_W) * 10000) / 100;
  return `clamp(${min}px, ${vw}vw, ${px}px)`;
}

const args = process.argv.slice(2);
const isType = args.includes('--type');
const px = Number(args.find((a) => a !== '--type'));

if (!px || Number.isNaN(px)) {
  console.error('Uso: node tools/fluid.js <px> [--type]');
  process.exit(1);
}

console.log(isType ? fluidType(px) : fluid(px));
