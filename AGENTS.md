# Instruções para IA

## Sobre este repositório

Este repositório é um laboratório de experimentação criado para testar o que é possível desenvolver utilizando exclusivamente Inteligência Artificial.

Todos os projetos são experimentos e podem envolver diferentes tipos de programas, jogos, ferramentas e aplicações.

## Regras de desenvolvimento

### 1. Não adicionar comentários ao código

**Não escreva comentários dentro do código.**

Não adicione comentários como:

* `// ...`
* `/* ... */`
* `# ...`
* Docstrings usadas apenas para explicar a implementação

O código deve ser escrito de forma clara e autoexplicativa através de bons nomes para variáveis, funções, classes e módulos.

Só utilize comentários se forem **absolutamente necessários para evitar uma ambiguidade que não possa ser resolvida pelo próprio código**.

### 2. Priorizar performance

Todo código deve ser desenvolvido visando **alta performance, eficiência e bom desempenho**.

Ao implementar qualquer funcionalidade:

* Evite operações desnecessárias.
* Evite processamento repetido.
* Evite loops desnecessários.
* Evite chamadas de API desnecessárias.
* Evite consultas desnecessárias ao banco de dados.
* Minimize o uso de memória quando possível.
* Prefira algoritmos e estruturas de dados eficientes.
* Evite criar objetos ou dados temporários sem necessidade.
* Utilize cache quando fizer sentido.
* Aproveite recursos assíncronos e concorrentes quando forem apropriados.
* Evite gargalos conhecidos.
* Considere o custo computacional das operações antes de implementá-las.

Performance deve ser considerada **desde o início da implementação**, e não apenas como uma otimização posterior.

### 3. Não otimizar de forma prejudicial

Performance não deve justificar código desnecessariamente complexo.

Quando duas soluções apresentarem desempenho semelhante, prefira a solução mais simples, legível e fácil de manter.

Não faça micro-otimizações que prejudiquem significativamente a clareza do código sem existir um benefício real de desempenho.

### 4. Respeitar o projeto existente

Antes de modificar qualquer coisa:

1. Analise a estrutura do projeto.
2. Entenda as tecnologias utilizadas.
3. Entenda como as partes do sistema se comunicam.
4. Preserve funcionalidades existentes.
5. Evite alterar arquivos que não sejam necessários.
6. Reutilize código e recursos existentes quando apropriado.

### 5. Dependências

Não adicione dependências externas sem necessidade.

Antes de instalar uma nova biblioteca, verifique se a funcionalidade pode ser implementada utilizando recursos já disponíveis no projeto.

### 6. Código

O código deve ser:

* eficiente;
* simples;
* direto;
* modular;
* consistente com o restante do projeto;
* preparado para evitar gargalos;
* adequado à tecnologia utilizada.

Evite abstrações desnecessárias, código duplicado e soluções excessivamente complexas.

## Filosofia

Este repositório existe para descobrir **o que é possível criar utilizando IA**.

Os projetos não precisam necessariamente seguir padrões de produção ou representar a melhor arquitetura possível. Entretanto, sempre que houver uma escolha de implementação, a IA deve buscar uma solução funcional, eficiente e bem estruturada.

## Organização

Sempre que criar um novo projeto, adicione-o ao `index.html` na raiz do projeto, seguindo o mesmo padrão utilizado nos projetos já cadastrados.


**Crie de forma simples. Execute de forma eficiente. Não desperdice recursos.**
