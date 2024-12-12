
# Algoritmo Genético (GA) - Criptoaritmética

Este repositório contém a implementação de um Algoritmo Genético (GA) em JavaScript, projetado para resolver problemas de criptoaritmética. O objetivo principal é encontrar mapeamentos entre letras e dígitos para satisfazer equações matemáticas como `SEND + MORE = MONEY`.

## Funcionamento Geral

O Algoritmo Genético simula um processo evolutivo inspirado na biologia. Ele utiliza técnicas de:
- **Seleção:** Escolha dos indivíduos mais aptos (menor erro).
- **Cruzamento (Recombinação):** Combinação de características de dois pais para criar filhos.
- **Mutação:** Alterações aleatórias para garantir diversidade genética.
- **Reinserção:** Substituição da população antiga por uma nova, priorizando os melhores indivíduos.

O processo continua por várias gerações até encontrar uma solução viável ou atingir o número máximo de iterações.

## Estrutura do Código

### Construtor
Configura o algoritmo:
- `tamanhoPopulacao`: Número de indivíduos na população.
- `geracoes`: Número de iterações.
- `problema`: Equação criptoarimética a ser resolvida.

### Principais Métodos

1. **`gerarIndividuo`:** Cria um indivíduo (permutação aleatória de dígitos de 0 a 9). Garante que cada letra será mapeada para um único dígito.
2. **`calcularAptidao`:** Calcula o erro absoluto entre os lados esquerdo e direito da equação para um indivíduo.
3. **`inicializarPopulacao`:** Gera a população inicial e calcula a aptidão de cada indivíduo.
4. **`selecionarPais`:** Seleciona os pais usando o método de torneio (três indivíduos aleatórios, escolhe o melhor).
5. **`cruzar`:** Realiza cruzamento por ponto de corte único entre dois pais, gerando dois filhos.
6. **`mutar`:** Altera dois genes aleatórios no indivíduo com base em uma probabilidade configurável.
7. **`reinserirPopulacao`:** Substitui a população antiga pelos melhores indivíduos da nova geração.
8. **`executar`:** Realiza o ciclo evolutivo, incluindo seleção, cruzamento, mutação e reinserção.

### Fluxo do Algoritmo

1. **Inicialização:** Criação da população inicial aleatória.
2. **Avaliação:** Cálculo da aptidão de cada indivíduo.
3. **Seleção:** Escolha dos indivíduos mais aptos para reprodução.
4. **Cruzamento:** Combinação de pais para gerar filhos.
5. **Mutação:** Alteração aleatória para evitar estagnação.
6. **Reinserção:** Substituição da população antiga pela nova.
7. **Iteração:** Repetição do processo por várias gerações.

## Exemplo de Uso

Selecione uma equação de criptoaritmética no front-end e clique em **Resolver**. O algoritmo calculará e exibirá o melhor mapeamento encontrado, junto com sua aptidão.

### Código Básico
```javascript
const problema = "SEND + MORE = MONEY";
const ag = new AlgoritmoGenetico(100, 50, problema);
const melhor = ag.executar();

console.log("Melhor solução encontrada:");
console.log("Indivíduo:", melhor.individuo);
console.log("Aptidão:", melhor.aptidao);
```

## Tecnologias Utilizadas

- **JavaScript:** Linguagem principal da implementação.
- **HTML/CSS:** Interface gráfica para entrada de problemas e exibição dos resultados.

## Repositório

Repositório oficial no GitHub: [genetic.algorithm.GA](https://github.com/Phillipe17Macedo/genetic.algorithm.GA.git)

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto é licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
