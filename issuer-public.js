import StellarSdk from '@stellar/stellar-sdk';

const issuerSecret = 'SAR6QHU2KGE2Q4TJGV3B3DNVPJDB2EDIAWSZUAQ3ZGB5KVWEYVJ66RWA';
const issuerKeypair = StellarSdk.Keypair.fromSecret(issuerSecret);

console.log('Issuer public key:', issuerKeypair.publicKey());