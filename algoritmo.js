class AlgoritmoGenetico {
  constructor(tamanhoPopulacao, geracoes, problema) {
    this.tamanhoPopulacao = tamanhoPopulacao;
    this.geracoes = geracoes;
    this.populacao = [];
    this.problema = problema;
    this.letras = [...new Set(problema.replace(/[^A-Z]/g, "").split(""))]; // Extrai letras únicas
  }

  gerarIndividuo() {
    const digitos = Array.from({ length: 10 }, (_, i) => i);
    return digitos.sort(() => Math.random() - 0.5); // Embaralha os dígitos
  }

  calcularAptidao(individuo) {
    const mapeamento = {};
    this.letras.forEach((letra, i) => {
      mapeamento[letra] = individuo[i];
    });

    const [ladoEsquerdo, ladoDireito] = this.problema.split("=");
    const calcularLado = (lado) => {
      return lado
        .match(/[A-Z]+/g) // Encontra palavras
        .reduce(
          (soma, palavra) =>
            soma + parseInt([...palavra].map((l) => mapeamento[l]).join("")),
          0
        );
    };

    const valorEsquerdo = calcularLado(ladoEsquerdo);
    const valorDireito = parseInt(
      [...ladoDireito].map((l) => mapeamento[l]).join("")
    );

    return Math.abs(valorEsquerdo - valorDireito); // Erro absoluto
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
    torneio.sort((a, b) => a.aptidao - b.aptidao);
    return torneio[0];
  }

  cruzar(pai1, pai2) {
    const pontoCorte = Math.floor(Math.random() * pai1.length);
    const filho1 = pai1.slice(0, pontoCorte).concat(pai2.slice(pontoCorte));
    const filho2 = pai2.slice(0, pontoCorte).concat(pai1.slice(pontoCorte));
    return [filho1, filho2];
  }

  mutar(individuo) {
    const [pos1, pos2] = [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ];
    [individuo[pos1], individuo[pos2]] = [individuo[pos2], individuo[pos1]];
  }

  executar() {
    this.inicializarPopulacao();
    for (let geracao = 0; geracao < this.geracoes; geracao++) {
      this.populacao.sort((a, b) => a.aptidao - b.aptidao);
      const novaPopulacao = [];
      while (novaPopulacao.length < this.tamanhoPopulacao) {
        const pai1 = this.selecionarPais().individuo;
        const pai2 = this.selecionarPais().individuo;
        const [filho1, filho2] = this.cruzar(pai1, pai2);
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
      this.populacao = novaPopulacao;
    }
    return this.populacao[0];
  }
}

document.getElementById("resolver").addEventListener("click", () => {
  const problema = document.getElementById("problema").value;
  const ag = new AlgoritmoGenetico(100, 50, problema);
  const melhor = ag.executar();

  // Exibe o resultado
  const solucao = document.getElementById("solucao");
  solucao.innerHTML = `Melhor solução encontrada:<br>
    Indivíduo: ${melhor.individuo}<br>
    Aptidão: ${melhor.aptidao}`;
});
