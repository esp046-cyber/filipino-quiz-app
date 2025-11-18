/**
 * Filipino Question Bank - Sample Questions
 * Comprehensive set of culturally relevant Filipino questions
 */

export const filipinoQuestionBank = {
  // ========================================================================
  // FILIPINO GRAMMAR (Gramatika ng Filipino)
  // ========================================================================
  filipino_grammar: [
    {
      id: 'fg_001',
      questionText: {
        tl: 'Ano ang tawag sa salitang naglalarawan ng pangngalan?',
        en: 'What do you call a word that describes a noun?',
        ceb: 'Unsa ang tawag sa pulong nga naghulagway sa ngalan?'
      },
      difficulty: 2,
      points: 2,
      culturalContext: 'Ang Filipino grammar ay may malalim na ugat sa wikang Tagalog at iba pang wika ng Pilipinas.',
      options: [
        {
          text: { tl: 'Pang-uri', en: 'Adjective', ceb: 'Pang-uri' },
          isCorrect: true,
          partialCredit: 100,
          explanation: { tl: 'Tama! Ang pang-uri ay naglalarawan sa pangngalan.', en: 'Correct! Adjectives describe nouns.' }
        },
        {
          text: { tl: 'Pandiwa', en: 'Verb', ceb: 'Berbo' },
          isCorrect: false,
          partialCredit: 0
        },
        {
          text: { tl: 'Pang-abay', en: 'Adverb', ceb: 'Pang-abay' },
          isCorrect: false,
          partialCredit: 25
        },
        {
          text: { tl: 'Panghalip', en: 'Pronoun', ceb: 'Panghalip' },
          isCorrect: false,
          partialCredit: 0
        }
      ]
    },
    {
      id: 'fg_002',
      questionText: {
        tl: 'Alin ang tamang pokus ng pandiwa sa pangungusap: "Binili ni Juan ang sapatos"?',
        en: 'What is the correct verb focus in the sentence: "Binili ni Juan ang sapatos"?',
        ceb: 'Asa ang husto nga pokus sa berbo sa tudling: "Binili ni Juan ang sapatos"?'
      },
      difficulty: 3,
      points: 3,
      culturalContext: 'Ang Filipino ay may natatanging sistema ng pokus ng pandiwa na wala sa English.',
      options: [
        {
          text: { tl: 'Pokus sa Layon', en: 'Object Focus', ceb: 'Pokus sa Layon' },
          isCorrect: true,
          partialCredit: 100,
          explanation: { tl: 'Tama! "Binili" ay nakatuon sa layon na "sapatos".', en: 'Correct! "Binili" focuses on the object "sapatos".' }
        },
        {
          text: { tl: 'Pokus sa Tagaganap', en: 'Actor Focus', ceb: 'Pokus sa Tagsabot' },
          isCorrect: false,
          partialCredit: 20
        },
        {
          text: { tl: 'Pokus sa Direksyon', en: 'Directional Focus', ceb: 'Pokus sa Direksyon' },
          isCorrect: false,
          partialCredit: 0
        },
        {
          text: { tl: 'Pokus sa Lokasyon', en: 'Locative Focus', ceb: 'Pokus sa Lokasyon' },
          isCorrect: false,
          partialCredit: 0
        }
      ]
    }
  ],

  // ========================================================================
  // PHILIPPINE HISTORY (Kasaysayan ng Pilipinas)
  // ========================================================================
  philippine_history: [
    {
      id: 'ph_001',
      questionText: {
        tl: 'Sino ang pambansang bayani ng Pilipinas?',
        en: 'Who is the national hero of the Philippines?',
        ceb: 'Kinsa ang pambansang bayani sa Pilipinas?'
      },
      difficulty: 1,
      points: 1,
      culturalContext: 'Si Jose Rizal ay kilala bilang "Dakilang Lumpo" at simbolo ng nasyonalismo.',
      options: [
        {
          text: { tl: 'Jose Rizal', en: 'Jose Rizal', ceb: 'Jose Rizal' },
          isCorrect: true,
          partialCredit: 100,
          explanation: { tl: 'Tama! Si Dr. Jose Rizal ang pambansang bayani ng Pilipinas.', en: 'Correct! Dr. Jose Rizal is the national hero of the Philippines.' }
        },
        {
          text: { tl: 'Andres Bonifacio', en: 'Andres Bonifacio', ceb: 'Andres Bonifacio' },
          isCorrect: false,
          partialCredit: 40,
          explanation: { tl: 'Si Bonifacio ay "Ama ng Katipunan" ngunit hindi opisyal na pambansang bayani.', en: 'Bonifacio is the "Father of the Katipunan" but not the official national hero.' }
        },
        {
          text: { tl: 'Emilio Aguinaldo', en: 'Emilio Aguinaldo', ceb: 'Emilio Aguinaldo' },
          isCorrect: false,
          partialCredit: 30
        },
        {
          text: { tl: 'Lapu-Lapu', en: 'Lapu-Lapu', ceb: 'Lapu-Lapu' },
          isCorrect: false,
          partialCredit: 25
        }
      ]
    },
    {
      id: 'ph_002',
      questionText: {
        tl: 'Kailan ipinanganak ang Republika ng Pilipinas?',
        en: 'When was the Republic of the Philippines born?',
        ceb: 'Kanus-a natawo ang Republika sa Pilipinas?'
      },
      difficulty: 2,
      points: 2,
      culturalContext: 'Ang Araw ng Kalayaan ay ipinagdiriwang tuwing Hunyo 12.',
      options: [
        {
          text: { tl: 'Hunyo 12, 1898', en: 'June 12, 1898', ceb: 'Hunyo 12, 1898' },
          isCorrect: true,
          partialCredit: 100,
          explanation: { tl: 'Tama! Idineklara ang kalayaan sa Kawit, Cavite noong Hunyo 12, 1898.', en: 'Correct! Independence was declared in Kawit, Cavite on June 12, 1898.' }
        },
        {
          text: { tl: 'Hulyo 4, 1946', en: 'July 4, 1946', ceb: 'Hulyo 4, 1946' },
          isCorrect: false,
          partialCredit: 50,
          explanation: { tl: 'Ito ang petsa ng kalayaan mula sa Amerika.', en: 'This is the date of independence from America.' }
        },
        {
          text: { tl: 'Agosto 26, 1896', en: 'August 26, 1896', ceb: 'Agosto 26, 1896' },
          isCorrect: false,
          partialCredit: 30
        },
        {
          text: { tl: 'Disyembre 30, 1896', en: 'December 30, 1896', ceb: 'Disyembre 30, 1896' },
          isCorrect: false,
          partialCredit: 20
        }
      ]
    },
    {
      id: 'ph_003',
      questionText: {
        tl: 'Ano ang tawag sa rebolusyonaryong kilusan na pinamunuan ni Andres Bonifacio?',
        en: 'What is the name of the revolutionary movement led by Andres Bonifacio?',
        ceb: 'Unsa ang ngalan sa rebolusyonaryong kalihukan nga gipangulohan ni Andres Bonifacio?'
      },
      difficulty: 2,
      points: 2,
      culturalContext: 'Ang Katipunan ay lihim na samahan na naglalayong makamit ang kalayaan.',
      options: [
        {
          text: { tl: 'Katipunan (KKK)', en: 'Katipunan (KKK)', ceb: 'Katipunan (KKK)' },
          isCorrect: true,
          partialCredit: 100,
          explanation: { tl: 'Tama! Ang Kataastaasan, Kagalang-galang na Katipunan ng mga Anak ng Bayan.', en: 'Correct! The Kataastaasan, Kagalang-galang na Katipunan ng mga Anak ng Bayan.' }
        },
        {
          text: { tl: 'La Liga Filipina', en: 'La Liga Filipina', ceb: 'La Liga Filipina' },
          isCorrect: false,
          partialCredit: 40
        },
        {
          text: { tl: 'Propaganda Movement', en: 'Propaganda Movement', ceb: 'Propaganda Movement' },
          isCorrect: false,
          partialCredit: 30
        },
        {
          text: { tl: 'Hukbalahap', en: 'Hukbalahap', ceb: 'Hukbalahap' },
          isCorrect: false,
          partialCredit: 0
        }
      ]
    }
  ],

  // ========================================================================
  // PHILIPPINE GEOGRAPHY (Heograpiya ng Pilipinas)
  // ========================================================================
  philippine_geography: [
    {
      id: 'pg_001',
      questionText: {
        tl: 'Ilang pulo mayroon sa Pilipinas?',
        en: 'How many islands are there in the Philippines?',
        ceb: 'Pila ka isla ang anaa sa Pilipinas?'
      },
      difficulty: 1,
      points: 1,
      culturalContext: 'Ang Pilipinas ay arkipelago na binubuo ng libu-libong pulo.',
      options: [
        {
          text: { tl: 'Mahigit 7,000', en: 'More than 7,000', ceb: 'Labaw sa 7,000' },
          isCorrect: true,
          partialCredit: 100,
          explanation: { tl: 'Tama! May 7,641 pulo ang Pilipinas.', en: 'Correct! The Philippines has 7,641 islands.' }
        },
        {
          text: { tl: 'Mahigit 5,000', en: 'More than 5,000', ceb: 'Labaw sa 5,000' },
          isCorrect: false,
          partialCredit: 40
        },
        {
          text: { tl: 'Mahigit 10,000', en: 'More than 10,000', ceb: 'Labaw sa 10,000' },
          isCorrect: false,
          partialCredit: 20
        },
        {
          text: { tl: 'Mahigit 3,000', en: 'More than 3,000', ceb: 'Labaw sa 3,000' },
          isCorrect: false,
          partialCredit: 0
        }
      ]
    },
    {
      id: 'pg_002',
      questionText: {
        tl: 'Ano ang pinakamataas na bundok sa Pilipinas?',
        en: 'What is the highest mountain in the Philippines?',
        ceb: 'Unsa ang pinakataas nga bukid sa Pilipinas?'
      },
      difficulty: 2,
      points: 2,
      culturalContext: 'Ang Mount Apo ay banal na lugar para sa mga Lumad.',
      options: [
        {
          text: { tl: 'Mount Apo', en: 'Mount Apo', ceb: 'Mount Apo' },
          isCorrect: true,
          partialCredit: 100,
          explanation: { tl: 'Tama! Ang Mount Apo sa Davao ay may taas na 2,954 metro.', en: 'Correct! Mount Apo in Davao is 2,954 meters high.' }
        },
        {
          text: { tl: 'Mount Pulag', en: 'Mount Pulag', ceb: 'Mount Pulag' },
          isCorrect: false,
          partialCredit: 40
        },
        {
          text: { tl: 'Mount Mayon', en: 'Mount Mayon', ceb: 'Mount Mayon' },
          isCorrect: false,
          partialCredit: 30
        },
        {
          text: { tl: 'Mount Banahaw', en: 'Mount Banahaw', ceb: 'Mount Banahaw' },
          isCorrect: false,
          partialCredit: 10
        }
      ]
    }
  ],

  // ========================================================================
  // FILIPINO CULTURE (Kultura ng Pilipinas)
  // ========================================================================
  filipino_culture: [
    {
      id: 'fc_001',
      questionText: {
        tl: 'Ano ang tawag sa tradisyonal na sayaw sa Visayas na ginagawa tuwing Sinulog Festival?',
        en: 'What is the traditional dance in Visayas performed during Sinulog Festival?',
        ceb: 'Unsa ang tawag sa tradisyonal nga sayaw sa Bisaya nga gihimo sa Sinulog Festival?'
      },
      difficulty: 2,
      points: 2,
      culturalContext: 'Ang Sinulog ay isa sa pinakatanyag na relihiyoso at kultural na pista sa Pilipinas.',
      options: [
        {
          text: { tl: 'Sinulog', en: 'Sinulog', ceb: 'Sinulog' },
          isCorrect: true,
          partialCredit: 100,
          explanation: { tl: 'Tama! Ang Sinulog ay ipinagdiriwang sa Cebu tuwing ikatlong Linggo ng Enero.', en: 'Correct! Sinulog is celebrated in Cebu every third Sunday of January.' }
        },
        {
          text: { tl: 'Tinikling', en: 'Tinikling', ceb: 'Tinikling' },
          isCorrect: false,
          partialCredit: 25
        },
        {
          text: { tl: 'Pandanggo sa Ilaw', en: 'Pandanggo sa Ilaw', ceb: 'Pandanggo sa Ilaw' },
          isCorrect: false,
          partialCredit: 15
        },
        {
          text: { tl: 'Singkil', en: 'Singkil', ceb: 'Singkil' },
          isCorrect: false,
          partialCredit: 10
        }
      ]
    },
    {
      id: 'fc_002',
      questionText: {
        tl: 'Ano ang tawag sa Filipino value ng utang na loob?',
        en: 'What is the Filipino value of "utang na loob" called in English?',
        ceb: 'Unsa ang gitawag sa Filipino value nga "utang na loob" sa English?'
      },
      difficulty: 3,
      points: 3,
      culturalContext: 'Ang utang na loob ay mahalagang bahagi ng Filipino social relationships.',
      options: [
        {
          text: { tl: 'Debt of gratitude', en: 'Debt of gratitude', ceb: 'Debt of gratitude' },
          isCorrect: true,
          partialCredit: 100,
          explanation: { tl: 'Tama! Ang utang na loob ay deeply felt obligation to repay kindness.', en: 'Correct! Utang na loob is a deeply felt obligation to repay kindness.' }
        },
        {
          text: { tl: 'Respect for elders', en: 'Respect for elders', ceb: 'Respect for elders' },
          isCorrect: false,
          partialCredit: 30
        },
        {
          text: { tl: 'Close family ties', en: 'Close family ties', ceb: 'Close family ties' },
          isCorredit: false,
          partialCredit: 20
        },
        {
          text: { tl: 'Hospitality', en: 'Hospitality', ceb: 'Hospitality' },
          isCorrect: false,
          partialCredit: 15
        }
      ]
    }
  ]
};

export default filipinoQuestionBank;
