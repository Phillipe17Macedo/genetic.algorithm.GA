class AlgoritmoGenetico {
  constructor(tamanhoPopulacao, geracoes, problema) {
    this.tamanhoPopulacao = tamanhoPopulacao;
    this.geracoes = geracoes;
    this.populacao = [];
    this.problema = problema;
    this.letras = [...new Set(problema.replace(/[^A-Z]/g, "").split(""))];
    this.taxaCrossover = 0.8;
    this.taxaMutacao = 0.1;
    this.metodoCrossover = "pmx";
    this.metodoReinsercao = "ordenada";
    this.metodoSelecao = "torneio";
    this.logs = [];
  }

  // algoritmo Fisher-Yates
  gerarIndividuo() {
    const digitos = Array.from({ length: 10 }, (_, i) => i);

    // Embaralha os números usando Fisher-Yates
    for (let i = digitos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digitos[i], digitos[j]] = [digitos[j], digitos[i]];
    }

    // Garante que o resultado é único e sem repetição
    return [...new Set(digitos)];
  }

  validarIndividuo(individuo) {
    return new Set(individuo).size === individuo.length;
  }

  corrigirIndividuo(individuo) {
    const valoresFaltantes = new Set(Array.from({ length: 10 }, (_, i) => i));
    const contagem = {};

    // Contar as ocorrências e identificar valores válidos
    individuo.forEach((gene) => {
      contagem[gene] = (contagem[gene] || 0) + 1;
      if (contagem[gene] === 1) valoresFaltantes.delete(gene);
    });

    // Substituir valores duplicados pelos valores faltantes
    return individuo.map((gene) => {
      if (contagem[gene] > 1) {
        contagem[gene]--; // Reduz a contagem da duplicata
        const valorFaltante = valoresFaltantes.values().next().value; // Pega o próximo valor faltante
        valoresFaltantes.delete(valorFaltante);
        return valorFaltante; // Substitui o valor duplicado
      }
      return gene; // Mantém o valor original se não for duplicado
    });
  }

  // Calculo a aptidao do individuo
  calcularAptidao(individuo) {
    try {
      const mapeamento = this.letras.reduce((map, letra, i) => {
        map[letra] = individuo[i];
        return map;
      }, {});

      // Validação: Primeiras letras de cada palavra não podem ser 0
      const palavras = this.problema.split(/[^A-Z]/).filter(Boolean);
      const primeirasLetras = palavras.map((palavra) => palavra[0]);
      for (let letra of primeirasLetras) {
        if (mapeamento[letra] === 0) return Infinity;
      }

      // Converto cada palavra em um numero
      // SEND -> [9, 5, 6, 7] -> "9567" -> 9567
      const calcularLado = (lado) =>
        lado.match(/[A-Z]+/g).reduce(
          (soma, palavra) =>
            soma +
            parseInt(
              palavra
                .split("")
                .map((l) => mapeamento[l])
                .join("")
            ),
          0
        );

      // Lado esquerdo: SEND e MORE → 9567 + 1085 = 10652.
      // Lado direito: MONEY → 10652.
      const [ladoEsquerdo, ladoDireito] = this.problema.split("=");
      const valorEsquerdo = calcularLado(ladoEsquerdo);
      // O lado direito é tratado como uma única palavra e convertido diretamente em número.
      const valorDireito = parseInt(
        ladoDireito
          .split("")
          .map((l) => mapeamento[l])
          .join("")
      );

      return Math.abs(valorEsquerdo - valorDireito);
    } catch (error) {
      console.error("Erro ao calcular aptidão:", error);
      return Infinity;
    }
  }

  crossover(pai1, pai2) {
    // Verifica o metodo de crossover
    if (this.metodoCrossover === "pmx") return this.pmx(pai1, pai2);
    if (this.metodoCrossover === "ciclico") return this.ciclico(pai1, pai2);

    // Dividir os genes de cada pai e recombinar para dois filhos
    const pontoCorte = Math.floor(Math.random() * pai1.length);
    return [
      pai1.slice(0, pontoCorte).concat(pai2.slice(pontoCorte)),
      pai2.slice(0, pontoCorte).concat(pai1.slice(pontoCorte)),
    ];
  }

  pmx(pai1, pai2) {
    // Exemplo: Se tamanho = 5, então ponto1 = 1 e ponto2 = 4 formam o segmento [1, 4)
    const tamanho = pai1.length;
    const ponto1 = Math.floor(Math.random() * tamanho);
    const ponto2 = Math.floor(Math.random() * (tamanho - ponto1)) + ponto1;

    // Cria os filhos inicialmente como vazios
    const filho1 = new Array(tamanho).fill(null);
    const filho2 = new Array(tamanho).fill(null);

    // Copia os segmentos
    for (let i = ponto1; i < ponto2; i++) {
      filho1[i] = pai1[i];
      filho2[i] = pai2[i];
    }

    // Faço um mapeamento entre os genes
    // pai1: [2, 3, 4]
    // pai2: [4, 3, 2]
    // mapa1: {2 → 4, 3 → 3, 4 → 2}
    // mapa2: {4 → 2, 3 → 3, 2 → 4}
    const criarMapa = (segmento1, segmento2) => {
      const mapa = new Map();
      for (let i = 0; i < segmento1.length; i++) {
        mapa.set(segmento1[i], segmento2[i]);
      }
      return mapa;
    };

    const mapa1 = criarMapa(
      pai1.slice(ponto1, ponto2),
      pai2.slice(ponto1, ponto2)
    );
    const mapa2 = criarMapa(
      pai2.slice(ponto1, ponto2),
      pai1.slice(ponto1, ponto2)
    );

    // Resolvo o conflito de gene já existente no segmento
    const resolverConflito = (gene, mapa) => {
      while (mapa.has(gene)) {
        gene = mapa.get(gene);
      }
      return gene;
    };

    // Preenche os filhos com os genes restantes
    for (let i = 0; i < tamanho; i++) {
      if (filho1[i] === null) {
        filho1[i] = resolverConflito(pai2[i], mapa1);
      }
      if (filho2[i] === null) {
        filho2[i] = resolverConflito(pai1[i], mapa2);
      }
    }

    return [this.corrigirIndividuo(filho1), this.corrigirIndividuo(filho2)];
  }

  ciclico(pai1, pai2) {
    const tamanho = pai1.length;
    // Os filhos do tamanho do pai
    const filho1 = new Array(tamanho).fill(null);
    const filho2 = new Array(tamanho).fill(null);

    const preencherCiclo = (paiA, paiB, filho) => {
      let index = 0;
      const ciclo = new Set();

      // Identifica o ciclo
      // paiA = [1, 2, 3, 4, 5]
      // paiB = [5, 4, 3, 2, 1]
      // Ciclo identificado: Índices [0, 4] (genes 1 e 5).
      while (!ciclo.has(index)) {
        ciclo.add(index);
        filho[index] = paiA[index];
        index = paiA.indexOf(paiB[index]);
      }

      return filho;
    };

    // Preenche os filhos com base nos ciclos
    const filhosCorrigidos = [
      this.corrigirIndividuo(filho1),
      this.corrigirIndividuo(filho2),
    ];
    return filhosCorrigidos;

    // Completa os genes restantes
    for (let i = 0; i < tamanho; i++) {
      if (filho1[i] === null) filho1[i] = pai2[i];
      if (filho2[i] === null) filho2[i] = pai1[i];
    }

    return [filho1, filho2];
  }

  // Crio uma população única e sem repetições
  inicializarPopulacao() {
    // Não aceita duplicações
    const individuosUnicos = new Set();
    while (this.populacao.length < this.tamanhoPopulacao) {
      const individuo = this.gerarIndividuo();
      // [1, 2, 3, 4, 5] -> "1,2,3,4,5"
      const hash = individuo.join(",");
      if (!individuosUnicos.has(hash)) {
        individuosUnicos.add(hash);
        this.populacao.push({
          individuo,
          aptidao: this.calcularAptidao(individuo),
        });
      }
    }
  }

  selecionarPorTorneio(tamanhoTorneio = 3) {
    // Seleciona um conjunto aleatório de indivíduos para o torneio
    const torneio = [];
    for (let i = 0; i < tamanhoTorneio; i++) {
      torneio.push(
        this.populacao[Math.floor(Math.random() * this.tamanhoPopulacao)]
      );
    }

    // Retorna o melhor indivíduo do torneio (menor aptidão)
    return torneio.sort((a, b) => a.aptidao - b.aptidao)[0];
  }

  selecionarPorRoleta() {
    const aptidoesInvertidas = this.populacao.map(
      (individuo) => 1 / (1 + individuo.aptidao)
    ); // Inverte aptidões para indivíduos menos aptos não dominarem
    const somaTotal = aptidoesInvertidas.reduce(
      (soma, valor) => soma + valor,
      0
    );

    const probabilidadesAcumuladas = [];
    let acumulador = 0;

    // Calcula as probabilidades acumuladas
    for (let aptidao of aptidoesInvertidas) {
      acumulador += aptidao / somaTotal;
      probabilidadesAcumuladas.push(acumulador);
    }

    // Seleciona um indivíduo com base na roleta
    const roleta = Math.random();
    for (let i = 0; i < probabilidadesAcumuladas.length; i++) {
      if (roleta <= probabilidadesAcumuladas[i]) {
        return this.populacao[i];
      }
    }
  }

  selecionarPais() {
    if (this.metodoSelecao === "torneio") {
      return this.selecionarPorTorneio();
    } else if (this.metodoSelecao === "roleta") {
      return this.selecionarPorRoleta();
    } else {
      console.error("Método de seleção inválido:", this.metodoSelecao);
      throw new Error("Método de seleção inválido.");
    }
  }

  cruzar(pai1, pai2) {
    let filho1, filho2;
  
    if (this.metodoCrossover === "pmx") {
      [filho1, filho2] = this.pmx(pai1, pai2);
    } else if (this.metodoCrossover === "ciclico") {
      [filho1, filho2] = this.ciclico(pai1, pai2);
    } else {
      const pontoCorte = Math.floor(Math.random() * pai1.length);
      filho1 = pai1.slice(0, pontoCorte).concat(pai2.slice(pontoCorte));
      filho2 = pai2.slice(0, pontoCorte).concat(pai1.slice(pontoCorte));
    }
  
    // Corrigir os filhos antes de retornar
    return [this.corrigirIndividuo(filho1), this.corrigirIndividuo(filho2)];
  }  

  mutar(individuo) {
    if (Math.random() < this.taxaMutacao) {
      const [pos1, pos2] = [
        Math.floor(Math.random() * individuo.length),
        Math.floor(Math.random() * individuo.length),
      ];
      [individuo[pos1], individuo[pos2]] = [individuo[pos2], individuo[pos1]];
    }

    // Corrigir indivíduo após mutação
    return this.corrigirIndividuo(individuo);
  }

  //
  reinserirPopulacao(novaPopulacao) {
    // Seleciona os melhores indivíduos da nova geração
    if (this.metodoReinsercao === "elitismo") {
      const elite = this.populacao
        .sort((a, b) => a.aptidao - b.aptidao)
        .slice(0, Math.ceil(this.tamanhoPopulacao * 0.2));
      // Ordeno os indivíduos pela aptidão
      novaPopulacao = novaPopulacao
        .sort((a, b) => a.aptidao - b.aptidao)
        .slice(0, this.tamanhoPopulacao - elite.length)
        .concat(elite);
    } else {
      novaPopulacao = novaPopulacao
        .sort((a, b) => a.aptidao - b.aptidao)
        .slice(0, this.tamanhoPopulacao);
    }
    this.populacao = novaPopulacao;
  }

  logIteracao(geracao, melhorIndividuo) {
    const mapeamento = this.letras.reduce((map, letra, i) => {
      map[letra] = melhorIndividuo.individuo[i];
      return map;
    }, {});

    this.logs.push({
      geracao,
      melhorIndividuo: melhorIndividuo.individuo.join(", "),
      aptidao: melhorIndividuo.aptidao,
      mapeamento,
    });
  }

  executar() {
    this.inicializarPopulacao();

    for (let geracao = 0; geracao < this.geracoes; geracao++) {
      this.populacao.sort((a, b) => a.aptidao - b.aptidao);

      if (this.populacao[0].aptidao === 0) break; // Convergência atingida

      const novaPopulacao = [];
      while (novaPopulacao.length < this.tamanhoPopulacao) {
        const pai1 = this.selecionarPais().individuo;
        const pai2 = this.selecionarPais().individuo;

        const [filho1, filho2] =
          Math.random() < this.taxaCrossover
            ? this.cruzar(pai1, pai2)
            : [pai1, pai2];

        this.mutar(filho1);
        this.mutar(filho2);

        novaPopulacao.push({
          individuo: filho1,
          aptidao: this.calcularAptidao(filho1),
        });
        novaPopulacao.push({
          individuo: filho2,
          aptidao: this.calcularAptidao(filho2),
        });
      }

      this.reinserirPopulacao(novaPopulacao);
      this.logIteracao(geracao, this.populacao[0]);
    }

    const melhorIndividuo = this.populacao[0];
    const mapeamento = this.letras.reduce((map, letra, i) => {
      map[letra] = melhorIndividuo.individuo[i];
      return map;
    }, {});

    return { melhorIndividuo, mapeamento };
  }
}

function atualizarLogs(mensagem) {
  const logDetalhes = document.getElementById("logDetalhes");
  logDetalhes.textContent += mensagem + "\n";
  logDetalhes.scrollTop = logDetalhes.scrollHeight; // Rola automaticamente para o final dos logs
}

// // // Função para automatizar as execuções com 24 combinações
// async function executarCombinacoes() {
//   const configuracoes = [
//     { crossover: "pmx", selecao: "torneio", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.05 },
//     { crossover: "pmx", selecao: "torneio", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.1 },
//     { crossover: "pmx", selecao: "torneio", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.05 },
//     { crossover: "pmx", selecao: "torneio", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.1 },
//     { crossover: "pmx", selecao: "roleta", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.05 },
//     { crossover: "pmx", selecao: "roleta", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.1 },
//     { crossover: "pmx", selecao: "roleta", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.05 },
//     { crossover: "pmx", selecao: "roleta", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.1 },
//     { crossover: "ciclico", selecao: "torneio", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.05 },
//     { crossover: "ciclico", selecao: "torneio", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.1 },
//     { crossover: "ciclico", selecao: "torneio", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.05 },
//     { crossover: "ciclico", selecao: "torneio", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.1 },
//     { crossover: "ciclico", selecao: "roleta", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.05 },
//     { crossover: "ciclico", selecao: "roleta", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.1 },
//     { crossover: "ciclico", selecao: "roleta", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.05 },
//     { crossover: "ciclico", selecao: "roleta", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.1 },
//     { crossover: "corte", selecao: "torneio", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.05 },
//     { crossover: "corte", selecao: "torneio", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.1 },
//     { crossover: "corte", selecao: "torneio", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.05 },
//     { crossover: "corte", selecao: "torneio", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.1 },
//     { crossover: "corte", selecao: "roleta", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.05 },
//     { crossover: "corte", selecao: "roleta", reinsercao: "ordenada", crossoverTaxa: 0.6, mutacaoTaxa: 0.1 },
//     { crossover: "corte", selecao: "roleta", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.05 },
//     { crossover: "corte", selecao: "roleta", reinsercao: "elitismo", crossoverTaxa: 0.8, mutacaoTaxa: 0.1 },
//   ];

//   const problema = "SEND+MORE=MONEY";

//   let resultados = "Problema,Configuração,Taxa Crossover,Taxa Mutação,Convergência (%),Tempo Médio (s)\n";

//   for (const config of configuracoes) {
//     const convergencias = [];
//     const inicio = performance.now();

//     for (let i = 0; i < 1000; i++) { // Executa 1000 vezes para cada configuração
//       const ag = new AlgoritmoGenetico(100, 50, problema);
//       ag.metodoCrossover = config.crossover;
//       ag.metodoSelecao = config.selecao;
//       ag.metodoReinsercao = config.reinsercao;
//       ag.taxaCrossover = config.crossoverTaxa;
//       ag.taxaMutacao = config.mutacaoTaxa;

//       const resultado = ag.executar();
//       if (resultado.aptidao === 0) convergencias.push(1);
//     }

//     const fim = performance.now();
//     const convergenciaPercentual = (convergencias.length / 1000) * 100;
//     const tempoMedio = ((fim - inicio) / 1000).toFixed(2);

//     // Adiciona o resultado ao CSV
//     resultados += `${problema},"Crossover(${config.crossover}), Seleção(${config.selecao}), Reinserção(${config.reinsercao})",${config.crossoverTaxa},${config.mutacaoTaxa},${convergenciaPercentual},${tempoMedio}\n`;
//   }

//   // Gera o arquivo CSV
//   gerarArquivoCSV(resultados, "resultados_AG.csv");
// }

// const problemas = [
//   "SEND+MORE=MONEY",
//   "CROSS+ROADS=DANGER",
//   "DONALD+GERALD=ROBERT",
//   "EAT+THAT=APPLE",
//   "COCA+COLA=OASIS",
// ];

// async function executarTodosProblemas() {
//   let resultados =
//     "Problema,Configuração,Convergência (%),Tempo Médio (s),Mapeamento\n";

//   for (const problema of problemas) {
//     for (const config of configuracoes) {
//       const convergencias = [];
//       const inicio = performance.now();

//       for (let i = 0; i < 1000; i++) {
//         const ag = new AlgoritmoGenetico(100, 50, problema);
//         ag.metodoCrossover = config.crossover;
//         ag.metodoSelecao = config.selecao;
//         ag.metodoReinsercao = config.reinsercao;
//         ag.taxaCrossover = config.crossoverTaxa;
//         ag.taxaMutacao = config.mutacaoTaxa;

//         const { melhorIndividuo, mapeamento } = ag.executar();

//         if (melhorIndividuo.aptidao === 0) convergencias.push(mapeamento);
//       }

//       const fim = performance.now();
//       const convergenciaPercentual = (convergencias.length / 1000) * 100;
//       const tempoMedio = ((fim - inicio) / 1000).toFixed(2);

//       resultados += `${problema},"${JSON.stringify(
//         config
//       )}",${convergenciaPercentual},${tempoMedio},"${JSON.stringify(
//         convergencias[0] || "N/A"
//       )}"\n`;
//     }
//   }

//   gerarArquivoCSV(resultados, "resultados_completos.csv");
// }

// Execução automática das combinações
async function executarCombinacoes() {
  const configuracoes = [
    {
      crossover: "pmx",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "pmx",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "pmx",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "pmx",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "pmx",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "pmx",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "pmx",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "pmx",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "ciclico",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "ciclico",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "ciclico",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "ciclico",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "ciclico",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "ciclico",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "ciclico",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "ciclico",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "corte",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "corte",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "corte",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "corte",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "corte",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "corte",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "corte",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "corte",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
  ];

  const problema = "SEND+MORE=MONEY";
  let resultados =
    "Problema,Execução,Configuração,Taxa Crossover,Taxa Mutação,Aptidão Final,Tempo de Execução (ms),Mapeamento\n";

  for (const config of configuracoes) {
    for (let i = 1; i <= 1000; i++) {
      const inicio = performance.now();

      const ag = new AlgoritmoGenetico(100, 50, problema);
      ag.metodoCrossover = config.crossover;
      ag.metodoSelecao = config.selecao;
      ag.metodoReinsercao = config.reinsercao;
      ag.taxaCrossover = config.crossoverTaxa;
      ag.taxaMutacao = config.mutacaoTaxa;

      const resultado = ag.executar();
      const fim = performance.now();

      resultados += `${problema},${i},"Crossover(${
        config.crossover
      }), Seleção(${config.selecao}), Reinserção(${config.reinsercao})",${
        config.crossoverTaxa
      },${config.mutacaoTaxa},${resultado.melhorIndividuo.aptidao},${(
        fim - inicio
      ).toFixed(2)},"${JSON.stringify(resultado.mapeamento)}"\n`;
    }
  }

  gerarArquivoCSV(resultados, "resultados_1000_execucoes.csv");
}

// Execução para múltiplos problemas com melhores configurações
async function executarTodosProblemas() {
  const melhoresConfiguracoes = [
    {
      crossover: "pmx",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "ciclico",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "pmx",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "corte",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
  ];

  const problemas = [
    "SEND+MORE=MONEY",
    "CROSS+ROADS=DANGER",
    "DONALD+GERALD=ROBERT",
    "EAT+THAT=APPLE",
    "COCA+COLA=OASIS",
  ];

  let resultados =
    "Problema,Configuração,Convergência (%),Tempo Médio (s),Mapeamento\n";

  for (const problema of problemas) {
    for (const config of melhoresConfiguracoes) {
      const convergencias = [];
      const inicio = performance.now();

      for (let i = 0; i < 1000; i++) {
        const ag = new AlgoritmoGenetico(100, 50, problema);
        ag.metodoCrossover = config.crossover;
        ag.metodoSelecao = config.selecao;
        ag.metodoReinsercao = config.reinsercao;
        ag.taxaCrossover = config.crossoverTaxa;
        ag.taxaMutacao = config.mutacaoTaxa;

        const { melhorIndividuo, mapeamento } = ag.executar();
        if (melhorIndividuo.aptidao === 0) convergencias.push(mapeamento);
      }

      const fim = performance.now();
      const convergenciaPercentual = (convergencias.length / 1000) * 100;
      const tempoMedio = ((fim - inicio) / 1000).toFixed(2);

      resultados += `${problema},"${JSON.stringify(
        config
      )}",${convergenciaPercentual},${tempoMedio},"${JSON.stringify(
        convergencias[0] || "N/A"
      )}"\n`;
    }
  }

  gerarArquivoCSV(resultados, "resultados_problemas.csv");
}
// Função para gerar e baixar o arquivo CSV
function gerarArquivoCSV(conteudo, nomeArquivo) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", nomeArquivo);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document
  .getElementById("toggleCustomProblema")
  .addEventListener("click", () => {
    const problemaSelect = document.getElementById("problema");
    const customContainer = document.getElementById("customProblemContainer");
    const toggleButton = document.getElementById("toggleCustomProblema");

    if (customContainer.style.display === "none") {
      customContainer.style.display = "block";
      problemaSelect.disabled = true;
      toggleButton.textContent = "Usar problema predefinido";
    } else {
      customContainer.style.display = "none";
      problemaSelect.disabled = false;
      toggleButton.textContent = "Usar problema personalizado";
    }
  });

document.getElementById("gerarCsv").addEventListener("click", async () => {
  const progresso = document.getElementById("progresso");
  progresso.textContent = "Gerando CSV, aguarde...";
  console.log("Iniciando worker para geração do CSV...");

  const worker = new Worker("worker.js");

  const configuracoes = [
    {
      crossover: "pmx",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "pmx",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "pmx",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "pmx",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "pmx",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "pmx",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "pmx",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "pmx",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "ciclico",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "ciclico",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "ciclico",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "ciclico",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "ciclico",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "ciclico",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "ciclico",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "ciclico",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "corte",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "corte",
      selecao: "torneio",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "corte",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "corte",
      selecao: "torneio",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "corte",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "corte",
      selecao: "roleta",
      reinsercao: "ordenada",
      crossoverTaxa: 0.6,
      mutacaoTaxa: 0.1,
    },
    {
      crossover: "corte",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.05,
    },
    {
      crossover: "corte",
      selecao: "roleta",
      reinsercao: "elitismo",
      crossoverTaxa: 0.8,
      mutacaoTaxa: 0.1,
    },
  ];
  const problema = "SEND+MORE=MONEY";
  const execucoes = 1000;

  console.log("Enviando mensagem para o worker...");
  worker.postMessage({ configuracoes, problema, execucoes });

  worker.onmessage = function (e) {
    console.log("Recebendo resultados do worker");
    const resultados = e.data;

    const header = [
      "Problema",
      "Execução",
      "Configuração",
      "Taxa Crossover",
      "Taxa Mutação",
      "Aptidão Final",
      "Tempo de Execução (ms)",
      "Mapeamento",
    ].join(",");

    const csvContent =
      header + "\n" + resultados.map((row) => row.join(",")).join("\n");

    gerarArquivoCSV(csvContent, "resultados_otimizados.csv");
    progresso.textContent = "CSV gerado com sucesso!";
    console.log("CSV gerado e download iniciado");
    worker.terminate();
  };

  worker.onerror = function (error) {
    console.error("Erro no worker:", error.message);
    alert("Erro ao gerar o CSV. Consulte o console.");
    progresso.textContent = "Erro ao gerar o CSV.";
  };
});

document.getElementById("resolver").addEventListener("click", () => {
  if (!validarInputs()) return;

  const problemaSelect = document.getElementById("problema");
  const customProblema = document.getElementById("customProblema").value.trim();
  const problema =
    problemaSelect.disabled && customProblema
      ? customProblema
      : problemaSelect.value;

  const taxaCrossover =
    parseFloat(document.getElementById("taxaCrossover").value) / 100;
  const taxaMutacao =
    parseFloat(document.getElementById("taxaMutacao").value) / 100;
  const selecao = document.getElementById("selecao").value;
  const crossover = document.getElementById("crossover").value;
  const reinsercao = document.getElementById("reinsercao").value;

  try {
    const ag = new AlgoritmoGenetico(100, 50, problema);
    ag.taxaCrossover = taxaCrossover;
    ag.taxaMutacao = taxaMutacao;
    ag.metodoCrossover = crossover;
    ag.metodoSelecao = selecao;
    ag.metodoReinsercao = reinsercao;

    const { melhorIndividuo, mapeamento } = ag.executar();

    const solucao = document.getElementById("solucao");
    solucao.innerHTML = `
      <strong>Melhor solução encontrada:</strong><br>
      Indivíduo: ${melhorIndividuo.individuo.join(", ")}<br>
      Aptidão: ${melhorIndividuo.aptidao}<br>
      <strong>Mapeamento de letras:</strong><br>
      ${Object.entries(mapeamento)
        .map(([letra, numero]) => `${letra}: ${numero}`)
        .join(", ")}
    `;

    const logDetalhes = document.getElementById("logDetalhes");
    logDetalhes.textContent = ag.logs
      .map(
        (log) =>
          `Geração ${log.geracao}: Melhor Indivíduo - [${log.melhorIndividuo}], Aptidão - ${log.aptidao}`
      )
      .join("\n");
  } catch (error) {
    alert("Erro ao processar o problema: " + error.message);
  }
});

// Validação dos inputs da interface
function validarInputs() {
  const taxaCrossover = parseFloat(
    document.getElementById("taxaCrossover").value
  );
  const taxaMutacao = parseFloat(document.getElementById("taxaMutacao").value);

  if (isNaN(taxaCrossover) || taxaCrossover < 0 || taxaCrossover > 100) {
    alert("A taxa de crossover deve estar entre 0% e 100%.");
    return false;
  }

  if (isNaN(taxaMutacao) || taxaMutacao < 0 || taxaMutacao > 100) {
    alert("A taxa de mutação deve estar entre 0% e 100%.");
    return false;
  }

  return true;
}
