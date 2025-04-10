const fs = require('fs');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');

// banco de dados
const ldapDB = {
  grupos: [],
  usuarios: []
};

function processarXML(arquivo) {
  const xml = fs.readFileSync(`Desafio/${arquivo}`, 'utf8');
  const doc = new DOMParser().parseFromString(xml);
  const node = xpath.select1('/*', doc);

  if (arquivo.includes('AddGrupo')) {
    const id = xpath.select1('add-attr[@attr-name="Identificador"]/value/text()', node).toString().trim();
    ldapDB.grupos.push({
      id,
      descricao: xpath.select1('add-attr[@attr-name="Descricao"]/value/text()', node).toString().trim()
    });
  }

  if (arquivo.includes('AddUsuario')) {
    const login = xpath.select1('add-attr[@attr-name="Login"]/value/text()', node).toString().trim();
    ldapDB.usuarios.push({
      nome: xpath.select1('add-attr[@attr-name="Nome Completo"]/value/text()', node).toString().trim(),
      login,
      telefone: xpath.select1('add-attr[@attr-name="Telefone"]/value/text()', node)?.toString()?.replace(/\D/g, '') || '',
      grupos: xpath.select('add-attr[@attr-name="Grupo"]/value/text()', node).map(n => n.toString().trim())
    });
  }

  if (arquivo.includes('ModifyUsuario')) {
    const login = xpath.select1('association/text()', node).toString().trim();
    const usuario = ldapDB.usuarios.find(u => u.login === login);
    
    if (usuario) {
      const remover = xpath.select('modify-attr/remove-value/value/text()', node).map(n => n.toString().trim());
      const adicionar = xpath.select('modify-attr/add-value/value/text()', node).map(n => n.toString().trim());
      usuario.grupos = usuario.grupos.filter(g => !remover.includes(g)).concat(adicionar);
    }
  }
}

[
  'AddGrupo1.xml',
  'AddGrupo2.xml',
  'AddGrupo3.xml',
  'AddUsuario1.xml',
  'ModifyUsuario.xml'
].forEach(processarXML);

console.log('=== RESULTADO FINAL ===');
console.log('Grupos criados:', ldapDB.grupos.map(g => g.id).join(', '));
console.log('Usuários:');
ldapDB.usuarios.forEach(u => {
  console.log(`- ${u.login} (${u.nome})`);
  console.log(`  Grupos: ${u.grupos.join(', ')}`);
  console.log(`  Telefone: ${u.telefone || 'Não informado'}`);
});

console.log('\n=== TESTES ===');
console.assert(ldapDB.grupos.length === 3, '3 grupos criados');
console.assert(ldapDB.usuarios.length === 1, 'usuário criado');
console.assert(ldapDB.usuarios[0].grupos.includes('Grupo3'), 'Usuário no Grupo3');
console.assert(!ldapDB.usuarios[0].grupos.includes('Grupo2'), 'Usuário REMOVIDO do Grupo2');
console.log('Todos os testes passaram!');