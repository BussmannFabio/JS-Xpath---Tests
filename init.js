const { ldapClient, BASE_DN, conectarLDAP } = require('./ldap/ldapClient');
const { processarArquivo } = require('./services/processarArquivos');

async function criarOU(ou) {
  try {
    await new Promise((resolve, reject) => {
      ldapClient.add(`ou=${ou},${BASE_DN}`, {
        objectClass: ['top', 'organizationalUnit'],
        ou: ou
      }, (err) => {
        if (err) {
          if (err.message.includes('Entry Already Exists')) {
            console.log(`OU ${ou} já existe.`);
            resolve(); 
          } else {
            return reject(`Erro ao criar OU ${ou}: ${err.message}`);
          }
        } else {
          console.log(`OU ${ou} criada!`);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error(error);
  }
}

async function iniciar() {
  try {
    await conectarLDAP();
    await criarOU('usuarios');
    await criarOU('grupos');

    const arquivos = [
      'AddGrupo1.xml',
      'AddGrupo2.xml',
      'AddGrupo3.xml',
      'AddUsuario1.xml',
      'ModifyUsuario.xml'
    ];

    for (const arquivo of arquivos) {
      await processarArquivo(arquivo);
    }
  } catch (error) {
    console.error(`Erro crítico: ${error}`);
  } finally {
    ldapClient.unbind(() => {
      console.log(' Conexão LDAP encerrada.');
    });
  }
}

iniciar();
