/**
 * Script Gerador do Relatório de Auditoria de Segurança - TrevoTour
 * Renderiza o template HTML para PDF A4 via Microsoft Edge Headless
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = path.join(__dirname, 'relatorio-template.html');
const pdfPath = path.join(__dirname, 'relatorio-auditoria-seguranca.pdf');

if (!fs.existsSync(htmlPath)) {
  console.error('Arquivo relatorio-template.html não encontrado!');
  process.exit(1);
}

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const command = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${htmlPath}"`;

try {
  console.log('Gerando PDF via Microsoft Edge Headless...');
  execSync(command, { stdio: 'inherit' });
  
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`✅ Relatório em PDF gerado com sucesso!\nCaminho: ${pdfPath}\nTamanho: ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    console.error('Falha: o arquivo PDF não foi gerado.');
  }
} catch (err) {
  console.error('Erro ao gerar PDF:', err.message);
  process.exit(1);
}
