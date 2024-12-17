importScripts("algoritmoGenetico.js");

self.onmessage = async function (e) {
  const { configuracoes, problema, execucoes } = e.data;

  console.log("Worker iniciado");
  console.log(`Problema: ${problema}, Execuções: ${execucoes}`);

  const resultados = [];
  let execucaoAtual = 0;

  for (const config of configuracoes) {
    console.log("Configurando algoritmo:", config);

    for (let i = 1; i <= execucoes; i++) {
      execucaoAtual++;
      if (execucaoAtual % 100 === 0) {
        console.log(
          `Execução ${execucaoAtual}/${configuracoes.length * execucoes}`
        );
      }

      const inicio = performance.now();
      const ag = new AlgoritmoGenetico(100, 50, problema);
      ag.metodoCrossover = config.crossover;
      ag.metodoSelecao = config.selecao;
      ag.metodoReinsercao = config.reinsercao;
      ag.taxaCrossover = config.crossoverTaxa;
      ag.taxaMutacao = config.mutacaoTaxa;

      const resultado = ag.executar();
      const fim = performance.now();

      resultados.push([
        problema,
        i,
        `Crossover(${config.crossover}), Seleção(${config.selecao}), Reinserção(${config.reinsercao})`,
        config.crossoverTaxa,
        config.mutacaoTaxa,
        resultado.melhorIndividuo.aptidao,
        (fim - inicio).toFixed(2),
        JSON.stringify(resultado.mapeamento),
      ]);
    }
  }

  console.log("Finalizando worker e enviando resultados");
  self.postMessage(resultados);
};
