const { ldapClient, BASE_DN } = require('../ldap/ldapClient');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');
const fs = require('fs');
const ldap = require('ldapjs');
const path = require('path');

function parseXML(arquivo) {
  const caminhoArquivo = path.join(__dirname, '..', 'Desafio', arquivo);
  const xml = fs.readFileSync(caminhoArquivo, 'utf-8');
  return new DOMParser().parseFromString(xml);
}

async function adicionarGrupo(node) {
  const grupoId = xpath.select1('add-attr[@attr-name="Identificador"]/value/text()', node)?.data.trim();
  const descricao = xpath.select1('add-attr[@attr-name="Descricao"]/value/text()', node)?.data.trim();

  if (!grupoId) {
    console.error('Identificador de grupo não encontrado!');
    return;
  }

  try {
    await new Promise((resolve, reject) => {
      ldapClient.add(`cn=${grupoId},ou=grupos,${BASE_DN}`, {
        objectClass: ['top', 'groupOfNames'],
        cn: grupoId,
        description: descricao,
        member: [`cn=${grupoId},ou=grupos,${BASE_DN}`]
      }, (err) => {
        if (err) return reject(`Erro ao criar grupo ${grupoId}: ${err.message}`);
        console.log(`Grupo ${grupoId} criado!`);
        resolve();
      });
    });
  } catch (error) {
    console.error(error);
  }
}

async function adicionarUsuario(node) {
  const login = xpath.select1('add-attr[@attr-name="Login"]/value/text()', node)?.data.trim();
  const nome = xpath.select1('add-attr[@attr-name="Nome Completo"]/value/text()', node)?.data.trim();
  const telefone = xpath.select1('add-attr[@attr-name="Telefone"]/value/text()', node)?.data.replace(/\D/g, '') || '';

  if (!login) {
    console.error('Login do usuário não encontrado!');
    return;
  }

  try {
    await new Promise((resolve, reject) => {
      ldapClient.add(`cn=${login},ou=usuarios,${BASE_DN}`, {
        objectClass: ['top', 'inetOrgPerson'],
        cn: login,
        sn: nome,
        givenName: nome,
        telephoneNumber: telefone
      }, (err) => {
        if (err) return reject(`Erro ao criar usuário ${login}: ${err.message}`);
        console.log(`Usuário ${login} criado!`);
        resolve();
      });
    });
  } catch (error) {
    console.error(error);
  }
}

async function modificarUsuario(node) {
  const login = xpath.select1('association/text()', node)?.data.trim();
  const remover = xpath.select('modify-attr/remove-value/value/text()', node).map(n => n.data.trim());
  const adicionar = xpath.select('modify-attr/add-value/value/text()', node).map(n => n.data.trim());

  if (!login) {
    console.error(' Login do usuário para modificação não encontrado!');
    return;
  }

  const userDN = `cn=${login},ou=usuarios,${BASE_DN}`;
  const Change = ldap.Change;
  const Attribute = ldap.Attribute;

  try {
    for (const grupo of remover) {
      await new Promise((resolve, reject) => {
        ldapClient.modify(`cn=${grupo},ou=grupos,${BASE_DN}`,
          new Change({
            operation: 'delete',
            modification: new Attribute({
              type: 'member',
              values: [ userDN ]
            })
          }),
          (err) => {
            if (err) return reject(`Erro ao remover usuário ${login} do grupo ${grupo}: ${err.message}`);
            console.log(`Usuário ${login} removido do grupo ${grupo}!`);
            resolve();
          }
        );
      });
    }

    for (const grupo of adicionar) {
      await new Promise((resolve, reject) => {
        ldapClient.modify(`cn=${grupo},ou=grupos,${BASE_DN}`,
          new Change({
            operation: 'add',
            modification: new Attribute({
              type: 'member',
              values: [ userDN ]
            })
          }),
          (err) => {
            if (err) return reject(`Erro ao adicionar usuário ${login} ao grupo ${grupo}: ${err.message}`);
            console.log(`Usuário ${login} adicionado ao grupo ${grupo}!`);
            resolve();
          }
        );
      });
    }
  } catch (error) {
    console.error(error);
  }
}

async function processarArquivo(arquivo) {
  const doc = parseXML(arquivo);
  const node = xpath.select1('/*', doc);

  if (arquivo.includes('AddGrupo')) return adicionarGrupo(node);
  if (arquivo.includes('AddUsuario')) return adicionarUsuario(node);
  if (arquivo.includes('ModifyUsuario')) return modificarUsuario(node);
}

module.exports = { processarArquivo };
