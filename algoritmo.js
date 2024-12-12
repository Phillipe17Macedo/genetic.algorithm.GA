class AlgoritmoGenetico {
  constructor(tamanhoPopulacao, geracoes, problema) {
    this.tamanhoPopulacao = tamanhoPopulacao;
    this.geracoes = geracoes;
    this.populacao = [];
    this.problema = problema;
    this.letras = [...new Set(problema.replace(/[^A-Z]/g, "").split(""))];
    this.taxaCrossover = 0.8; // Taxa padrão
    this.taxaMutacao = 0.1; // Taxa padrão
    this.metodoCrossover = "corte"; // Padrão: corte único
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

      const calcularLado = (lado) =>
        lado.match(/[A-Z]+/g).reduce(
          (soma, palavra) =>
            soma +
            Number(
              palavra
                .split("")
                .map((l) => mapeamento[l])
                .join("")
            ),
          0
        );

      const [ladoEsquerdo, ladoDireito] = this.problema.split("=");
      const valorEsquerdo = calcularLado(ladoEsquerdo);
      const valorDireito = Number(
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

  logIteracao(geracao, melhorIndividuo) {
    this.logs.push({
      geracao,
      melhorIndividuo: melhorIndividuo.individuo.join(", "),
      aptidao: melhorIndividuo.aptidao,
    });
  }

  inicializarPopulacao() {
    for (let i = 0; i < this.tamanhoPopulacao; i++) {
      const individuo = this.gerarIndividuo();
      this.populacao.push({
        individuo,
        aptidao: this.calcularAptidao(individuo),
      });
    }
  }

  selecionarPais() {
    const torneio = [];
    for (let i = 0; i < 3; i++) {
      torneio.push(
        this.populacao[Math.floor(Math.random() * this.tamanhoPopulacao)]
      );
    }
    return torneio.sort((a, b) => a.aptidao - b.aptidao)[0];
  }

  cruzar(pai1, pai2) {
    if (this.metodoCrossover === "pmx") {
      return this.pmx(pai1, pai2);
    } else if (this.metodoCrossover === "ciclico") {
      return this.ciclico(pai1, pai2);
    }
    // Corte único (padrão)
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
    this.populacao = novaPopulacao
      .sort((a, b) => a.aptidao - b.aptidao)
      .slice(0, this.tamanhoPopulacao);
  }

  executar() {
    this.inicializarPopulacao();
    for (let geracao = 0; geracao < this.geracoes; geracao++) {
      this.populacao.sort((a, b) => a.aptidao - b.aptidao);
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
    return this.populacao[0];
  }
}

document.getElementById("resolver").addEventListener("click", () => {
  const problema = document.getElementById("problema").value;
  const taxaCrossover =
    parseFloat(document.getElementById("taxaCrossover").value) / 100;
  const taxaMutacao =
    parseFloat(document.getElementById("taxaMutacao").value) / 100;
  const selecao = document.getElementById("selecao").value;
  const crossover = document.getElementById("crossover").value;
  const reinsercao = document.getElementById("reinsercao").value;

  const ag = new AlgoritmoGenetico(100, 50, problema);
  ag.taxaCrossover = taxaCrossover;
  ag.taxaMutacao = taxaMutacao;
  ag.metodoCrossover = crossover;
  ag.metodoSelecao = selecao;
  ag.metodoReinsercao = reinsercao;

  const melhor = ag.executar();

  const solucao = document.getElementById("solucao");
  solucao.innerHTML = `Melhor solução encontrada:<br>
    Indivíduo: ${melhor.individuo.join(", ")}<br>
    Aptidão: ${melhor.aptidao}`;

  const logDetalhes = document.getElementById("logDetalhes");
  logDetalhes.textContent = ag.logs
    .map(
      (log) =>
        `Geração ${log.geracao}: Melhor Indivíduo - [${log.melhorIndividuo}], Aptidão - ${log.aptidao}`
    )
    .join("\n");
});
