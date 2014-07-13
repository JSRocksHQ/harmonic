<!--
layout: post
title: Uma nova sintaxe para módulos na ES6
date: 2014-07-11T07:18:47.847Z
comments: true
published: true
keywords: JavaScript, ES6, modules
description: Post about module syntax
categories: modules
authorName: Jean Carlo Emer
authorLink: http://twitter.com/jcemer
authorDescription: Internet craftsman, computer scientist and speaker. I am a full-stack web developer for some time and only write code that solves real problems.
authorPicture: https://avatars2.githubusercontent.com/u/353504?s=460
-->

O grupo TC39 - ECMAScript já está finalizando a sexta versão da especificação do ECMAScript. A [agenda do grupo](http://www.2ality.com/2014/06/es6-schedule.html) aponta o mês de junho do próximo ano como sendo a data de lançamento. A partir de agora, poucas mudanças significativas devem surgir. Já é tempo de se aprofundar no estudo.

Este artigo não pretende abordar a importância da escrita de código modularizado. Já escrevi sobre o assunto no artigo [Modularização em JavaScript](http://tableless.com.br/modularizacao-em-javascript). Sites como [JavaScript Modules](http://jsmodules.io) entre outros já são uma ótima referência sobre como escrever módulos ES6. A intenção aqui é esclarecer e justificar a necessidade de uma nova sintaxe para escrita de módulos.

## Formatos atuais

Os mais famosos formatos de definição de módulos até então eram o AMD, padrão para bibliotecas *client-side* e CommonJS, adotado pelo Node.js e levado para  navegadores pelo Browserify. Cada um  possui características determinadas pelo ecossistema em que são utilizados. A exemplo, o AMD encapsula cada módulo no interior de uma função definindo escopo e permitindo carregamento assíncrono de suas dependências nos navegadores. Por outro lado, os módulos CommonJS implicitamente definem a criação de um escopo de módulo o que inviabiliza seu uso diretamente em navegadores.

## A escolha de um formato

As bibliotecas são as que mais sofrem com a existência de diferentes formatos. A inconsistência pode ser normalizada com uma abstração que encapsula os módulos  e os torna funcionais em mais de um formato. O projeto [Universal Module Definition (UMD)](https://github.com/umdjs/umd) guarda uma coleção destas abstrações.

Acompanhando a evolução e observando o surgimento desta unificação, o problema de modularização parece resolvido. Engano. O projeto UMD guarda mais de dez variações de abstrações e todas desviam o código do módulo do seu objetivo: resolver o problema que é responsável. Observe o exemplo fictício do módulo UMD `add2` que depende de `add`:

```javascript
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    define(['add'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('add'));
  }
}(function (add) {
  return function (param) {
    return add(2, param);
  };
}));
```

Seguir escrevendo código para dois formatos (ou mais) seguindo o UMD não é uma boa opção. Por que não jogar [dois ou um](http://mapadobrincar.folha.com.br/brincadeiras/formulas-de-escolha/320-dois-ou-um) entre os membros do TC39 e escolher um único formato? Melhor analisar cada um dos formatos e identificar qual é mais poderoso em termos de expressividade.

### Analisando os formatos atuais

No formato AMD, encapsular o código do módulo em uma função trata-se de um contra tempo que não traz ganho algum em expressividade. A função faz parte de outro universo de resolução de problemas. Uma nova especificação poderia muito bem considerar que cada arquivo de módulo já possui seu próprio escopo, lembre-se que é uma nova versão da linguagem. Não nos restaria [nenhuma razão para adotar AMD](http://blog.millermedeiros.com/amd-is-better-for-the-web-than-commonjs-modules).

Os CommonJS Modules são mais expressivos. Trata-se de uma grande vantagem deixar de lado o encapsulamento através de funções e ainda poder indicar qual porção de código da dependência será utilizado já na sua importação `var debug = require('util').debug;` ou até já utilizar o código `require('util').debug('message on stderr');`.

Seguiremos considerando os módulos CommonJS e apontando quais seus pontos fracos que levaram gradativamente a adoção de uma nova sintaxe.

## Encapsulamento para módulos

Os protocolos de rede disponíveis atualmente nos navegadores penalizam a performance para o caso de vários arquivos de módulo serem requisitados. Empacotar todos os módulos em um único arquivo para serem utilizados no navegador é uma boa prática. Esta necessidade não existe em plataformas como Node.js, que possui rápido acesso ao sistema de arquivos.

Os módulos CommonJS não consideram o ambiente dos navegadores, diferentes módulos não podem fazer parte de um mesmo arquivo. A ferramenta [Browserify](http://browserify.org) viabiliza o uso de módulos *CommonJS* em navegadores. Isto somente é possível fazendo uso de funções para encapsular o código de cada um dos módulos. O resultado é de difícil leitura, [veja o arquivo bundler.js](https://gist.github.com/jcemer/b52db6503eebc42a414d).

Atualmente, a **única maneira de definir escopos no JavaScript é através de funções**. Uma nova especificação permite mudar o funcionamento da linguagem. A necessária criação dos escopos poderia ser melhor resolvida que no [Node.js que ainda utiliza funções por baixo dos panos](https://github.com/joyent/node/blob/b55c9d68aa713e75ff5077cd425cbaafde010b92/src/node.js#L788-L791).

A especificação ES6 traz consigo uma sintaxe exclusiva para definição de escopo de módulos. Através da sintaxe, é possível definir mais de um módulo em um mesmo arquivo sem apelar para o uso de funções que nos fizeram abrir mão do formato AMD. O resultado é um ganho significativo em expressividade, observe:

```javascript
module 'foo' {
    // Module code
}
module 'bar' {
    // Module code
}
```

## Requisição de dependências (imports)

Os módulos CommonJS foram concebidos para requisitar as dependências sincronamente. **A execução do script é bloqueada enquanto uma dependência é carregada**. Novamente, esta abordagem não traz nenhum inconveniente para o Node.js que possui um acesso rápido ao sistema de arquivos.

Considerando evoluções futuras nos protocolos de redes e mesmo se pensarmos nos dias atuais, um formato de módulo adequado para navegadores precisa operar com carregamento assíncrono das dependências. Para isto, os módulos precisam ser [analisados estaticamente](http://en.wikipedia.org/wiki/Static_program_analysis) a título de **identificar suas dependências antes de serem executados**. Assim é possível fazer o *download* simultâneo das dependências e condicionar a execução do módulo para quando as dependências estiverem prontas.

**Os formatos de módulos que dispomos não permitem análise estática**. Pegando como exemplo o formato CommonJS, [sua especificação esclarece](http://wiki.commonjs.org/wiki/Modules/1.0) que o `require` trata-se de uma função que aceita um identificador de módulo. Assim como qualquer outra função, seu argumento pode ser calculado de diferentes maneiras. Analise o código a seguir que também sofre a influência do controle de fluxo:

```javascript
if (type == 'me') {
  var user = require('me');
} else {
  var user = require('module' + Math.random());
}
```

Espero que isto já sirva para atestar como não é possível identificar as dependências nestes formatos sem que o código seja executado. Ferramentas como o Browserify [já não convertem módulos que tenham dependências dinâmicas](https://github.com/substack/node-browserify/issues/377) causando uma certa confusão. Apenas com uma sintaxe específica é possível coibir declarações de dependências como estas.

Os módulos ES6 trazem consigo toda a flexibilidade de declaração de dependências dos módulos CommonJS permitindo a análise estática do código:

```javascript
import asap from 'asap';
import { later } from 'asap';
import asap, { later } from 'asap';
```

Como apontado em [um comentário do Yehuda Katz](https://github.com/wycats/jsmodules/issues/8#issuecomment-47960446), não são permitidos códigos como este `if (type == 'me') { import user from 'me'; }`. Entretanto, a especificação não deixa de fora a possibilidade de executar requisições dinâmicas utilizando promessas:

```javascript
if (type == 'me') {
  this.import('me').then(function(user) {
    // do stuff here
  });
}
```

## Exportando código (exports)

O formato CommonJS permite exportar código através de propriedades no objeto contido na variável `exports`. O retorno de um módulo é um objeto com propriedades. Uma variação na implementação do Node.js possibilita que módulos retornem *por padrão* outros tipos de valores, observe o módulo `foo`:

```javascript
module.exports = exports = function defaultFn() {
  return 'default';
};

exports.another = function () { return 'another'; };
```

O código acima permite executar `require('foo')()` e `require('foo').another()`. O efeito colateral desta abordagem é adicionar propriedades diretamente na função `defaultFn`.

Utilizando a nova sintaxe, é possível declarar um retorno *padrão*. Os demais valores exportados não serão mais atribuídos na forma de propriedades na função `defaultFn`. Veja o mesmo exemplo transcrito:

```javascript
export default function defaultFn() {
  return 'default';
};

export function another() { return 'another'; };
```

## Palavras finais

A especificação do ES6 também abrange a definição de um *loader* responsável por requisições assíncronas que ainda permite utilizar módulos em diferentes formatos. O assunto está fora do escopo deste artigo. A seção [The Compilation Pipeline](https://gist.github.com/wycats/51c96e3adcdb3a68cbc3#the-compilation-pipeline) do artigo ES6 Modules de Yehuda Katz apresenta muito bem as possibilidades.

Espero que tenha convencido você da superioridade da nova sintaxe em relação a outros formatos de módulos. Claro que sintaxes trazem consigo o ônus do seu aprendizado. Mas neste caso, permitem ganho de expressividade e aumento das possibilidades.

A nova sintaxe de módulos leva em consideração com maestria todos os diferentes ambientes em que a linguagem é utilizada: *web server*, *desktop*, linha de comando e navegadores. Os módulos alteram significativamente o funcionamento da linguagem e são sem dúvida o melhor da nova especificação.
