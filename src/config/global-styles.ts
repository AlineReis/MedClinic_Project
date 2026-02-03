// // src/config/theme.ts

// // 1. CAMADA BASE (Corrigido para usar a pasta /base/)
// // No seu código estava '../../css/reset.css', mas o HTML usava 'base/reset.css'
// import '../../css/base/reset.css';
// import '../../css/base/variables.css';

// // Estes já estavam certos, mantenha:
// import '../../css/base/typography.css';
// import '../../css/base/utilities.css';

// // 2. CAMADA DE COMPONENTES (Botões, Modais, etc)
// // Importante carregar isso DEPOIS do base e ANTES do global
// import '../../css/components/buttons.css';
// import '../../css/components/forms.css';
// import '../../css/components/modals.css';

// // 3. CAMADA GLOBAL (Fica por último para sobrescrever o que for preciso)
// // No HTML ele era o último da lista. Mantenha essa lógica.
// import '../../css/global.css';
