#!/usr/bin/env node
/**
 * Pre-render script for static HTML generation
 * Run after build: node scripts/prerender.js
 * 
 * This script uses puppeteer to render pages and save the HTML
 * for better SEO crawling.
 */

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import handler from 'serve-handler';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const routes = [
  '/',
  '/about',
  '/services',
  '/projects',
  '/insights',
  '/contact',
  '/resources',
  '/resources/ai-assistant',
  '/resources/rental-yield-calculator',
  '/resources/stamp-duty-calculator',
  '/resources/subdivision-checker',
  '/book-consultation',
];

async function prerender() {
  console.log('Starting pre-render...');
  
  // Start a simple static server for the dist folder
  const server = createServer((req, res) => {
    return handler(req, res, {
      public: distDir,
      rewrites: [{ source: '**', destination: '/index.html' }],
    });
  });
  
  await new Promise((resolve) => server.listen(4173, resolve));
  console.log('Static server running on http://localhost:4173');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  
  for (const route of routes) {
    console.log(`Pre-rendering: ${route}`);
    
    const page = await browser.newPage();
    await page.goto(`http://localhost:4173${route}`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
    
    // Wait for React to render
    await page.waitForSelector('#root > *', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000)); // Extra wait for animations
    
    const html = await page.content();
    
    // Determine output path
    const outputPath = route === '/' 
      ? join(distDir, 'index.html')
      : join(distDir, route, 'index.html');
    
    // Create directory if needed
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Replace localhost URLs with production URL
    const finalHtml = html.replace(/http:\/\/localhost:\d+/gi, 'https://ghanprojects.com.au');
    
    writeFileSync(outputPath, finalHtml);
    console.log(`  Saved: ${outputPath}`);
    
    await page.close();
  }
  
  await browser.close();
  server.close();
  
  console.log('Pre-render complete!');
}

prerender().catch(console.error);
