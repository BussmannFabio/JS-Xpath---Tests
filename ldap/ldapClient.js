const ldap = require('ldapjs');

const ldapClient = ldap.createClient({
  url: 'ldap://localhost:389'
});

const BASE_DN = 'dc=desafioldap,dc=org';

function conectarLDAP() {
  return new Promise((resolve, reject) => {
    ldapClient.bind('cn=admin,dc=desafioldap,dc=org', '2142', (err) => {
      if (err) {
        return reject(`Erro ao conectar ao LDAP: ${err.message}`);
      }
      resolve('Conexão LDAP estabelecida com sucesso.');
    });
  });
}

module.exports = { ldapClient, BASE_DN, conectarLDAP };
