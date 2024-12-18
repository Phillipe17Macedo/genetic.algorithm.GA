const XLSX = require('xlsx');
const fs = require('fs');

// Função para calcular a média em porcentagem de aptidão zero
function calcularMediaAptidaoZero(caminhoArquivo) {
  // Lê o arquivo .xlsx
  const workbook = XLSX.readFile(caminhoArquivo);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Converte a planilha para JSON
  const dados = XLSX.utils.sheet_to_json(worksheet);

  // Filtra os dados com aptidão igual a zero
  const aptidaoZero = dados.filter((linha) => linha['Aptidão Final'] === 0);

  // Calcula a porcentagem
  const porcentagem = (aptidaoZero.length / dados.length) * 100;

  console.log(`A porcentagem de aptidão igual a zero é: ${porcentagem.toFixed(2)}%`);
  return porcentagem.toFixed(2);
}

// Caminho do arquivo .xlsx
const caminhoArquivo = './Relatório-Algoritmo-AG.xlsx';

// Executa a função
calcularMediaAptidaoZero(caminhoArquivo);
