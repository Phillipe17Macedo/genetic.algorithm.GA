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

  gerarIndividuo() {
    const digitos = Array.from({ length: 10 }, (_, i) => i);
    for (let i = digitos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digitos[i], digitos[j]] = [digitos[j], digitos[i]];
    }
    return digitos;
  }

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

      const [ladoEsquerdo, ladoDireito] = this.problema.split("=");
      const valorEsquerdo = calcularLado(ladoEsquerdo);
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
    if (this.metodoCrossover === "pmx") return this.pmx(pai1, pai2);
    if (this.metodoCrossover === "ciclico") return this.ciclico(pai1, pai2);

    const pontoCorte = Math.floor(Math.random() * pai1.length);
    return [
      pai1.slice(0, pontoCorte).concat(pai2.slice(pontoCorte)),
      pai2.slice(0, pontoCorte).concat(pai1.slice(pontoCorte)),
    ];
  }

  pmx(pai1, pai2) {
    const tamanho = pai1.length;
    const ponto1 = Math.floor(Math.random() * tamanho);
    const ponto2 = Math.floor(Math.random() * (tamanho - ponto1)) + ponto1;

    const filho1 = new Array(tamanho).fill(null);
    const filho2 = new Array(tamanho).fill(null);

    // Copia os segmentos
    for (let i = ponto1; i < ponto2; i++) {
      filho1[i] = pai1[i];
      filho2[i] = pai2[i];
    }

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

    return [filho1, filho2];
  }

  ciclico(pai1, pai2) {
    const tamanho = pai1.length;
    const filho1 = new Array(tamanho).fill(null);
    const filho2 = new Array(tamanho).fill(null);

    const preencherCiclo = (paiA, paiB, filho) => {
      let index = 0;
      const ciclo = new Set();

      // Identifica o ciclo
      while (!ciclo.has(index)) {
        ciclo.add(index);
        filho[index] = paiA[index];
        index = paiA.indexOf(paiB[index]);
      }

      return filho;
    };

    // Preenche os filhos com base nos ciclos
    preencherCiclo(pai1, pai2, filho1);
    preencherCiclo(pai2, pai1, filho2);

    // Completa os genes restantes
    for (let i = 0; i < tamanho; i++) {
      if (filho1[i] === null) filho1[i] = pai2[i];
      if (filho2[i] === null) filho2[i] = pai1[i];
    }

    return [filho1, filho2];
  }

  inicializarPopulacao() {
    const individuosUnicos = new Set();
    while (this.populacao.length < this.tamanhoPopulacao) {
      const individuo = this.gerarIndividuo();
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
    if (this.metodoCrossover === "pmx") {
      return this.pmx(pai1, pai2);
    } else if (this.metodoCrossover === "ciclico") {
      return this.ciclico(pai1, pai2);
    }
    const pontoCorte = Math.floor(Math.random() * pai1.length);
    return [
      pai1.slice(0, pontoCorte).concat(pai2.slice(pontoCorte)),
      pai2.slice(0, pontoCorte).concat(pai1.slice(pontoCorte)),
    ];
  }

  mutar(individuo) {
    if (Math.random() < this.taxaMutacao) {
      const [pos1, pos2] = [
        Math.floor(Math.random() * individuo.length),
        Math.floor(Math.random() * individuo.length),
      ];
      [individuo[pos1], individuo[pos2]] = [individuo[pos2], individuo[pos1]];
    }
  }

  reinserirPopulacao(novaPopulacao) {
    if (this.metodoReinsercao === "elitismo") {
      const elite = this.populacao
        .sort((a, b) => a.aptidao - b.aptidao)
        .slice(0, Math.ceil(this.tamanhoPopulacao * 0.2));
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

self.AlgoritmoGenetico = AlgoritmoGenetico;