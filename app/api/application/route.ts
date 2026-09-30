export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      job,
      company,
      location,
      description,
      name,
      italianLevel,
      experience,
      skills,
      availability,
      cvName,
    } = body;

    if (!name || !job || !italianLevel || !experience || !skills || !availability) {
      return Response.json(
        {
          success: false,
          error: "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    console.log("=== APPLICATION RECEIVED ===");

    console.log({
      job,
      company,
      location,
      description,
      name,
      italianLevel,
      experience,
      skills,
      availability,
      cvName,
    });

    const applicationPack = {
      whatsapp: `Buongiorno, sono ${name}. Sono interessato/a alla posizione di ${job}${
        company ? ` presso ${company}` : ""
      }. Ho un livello di italiano ${italianLevel} e sono disponibile ${availability}. Mi piacerebbe avere l'opportunità di presentarmi e parlare della posizione. Grazie!`,

      email: {
        subject: `Candidatura per la posizione di ${job}`,
        body: `Gentile ${company || "Responsabile HR"},

mi chiamo ${name} e desidero candidarmi per la posizione di ${job}${
          location ? ` a ${location}` : ""
        }.

Ho un livello di italiano ${italianLevel} e ho maturato la seguente esperienza:

${experience}

Tra le mie principali competenze ci sono:

${skills}

Sono disponibile ${availability} e sarei molto interessato/a a entrare a far parte della vostra realtà.

Resto a disposizione per un eventuale colloquio e per fornire ulteriori informazioni.

Cordiali saluti,
${name}`,
      },

      coverLetter: `Gentile Responsabile,

mi chiamo ${name} e sono interessato/a alla posizione di ${job}${
        company ? ` presso ${company}` : ""
      }.

Sono una persona motivata, seria e disponibile a imparare. Il mio livello di italiano è ${italianLevel} e la mia esperienza comprende:

${experience}

Ho inoltre sviluppato competenze in:

${skills}

Sono disponibile ${availability} e sarei felice di poter mettere le mie capacità a disposizione della vostra azienda.

Sono disponibile per un colloquio conoscitivo durante il quale potrò presentarmi meglio e parlare delle mie motivazioni.

Grazie per l'attenzione.

Cordiali saluti,
${name}`,

      interviewPrep: [
        {
          question: "Puoi presentarti?",
          answer: `Mi chiamo ${name}. Sono una persona motivata e responsabile. Ho esperienza in diversi ambiti e ho sviluppato competenze come ${skills}. Attualmente sto cercando un'opportunità come ${job} e sono disponibile ${availability}.`,
        },
        {
          question: "Perché vuoi lavorare con noi?",
          answer: `Sono interessato/a a questa posizione perché penso che sia una buona opportunità per mettere in pratica le mie competenze, imparare cose nuove e crescere professionalmente.`,
        },
        {
          question: "Quali sono i tuoi punti di forza?",
          answer: `I miei principali punti di forza sono la motivazione, la capacità di imparare velocemente e la disponibilità a lavorare in squadra.`,
        },
        {
          question: "Qual è il tuo livello di italiano?",
          answer: `Il mio livello di italiano è ${italianLevel}. Sto continuando a migliorare la lingua e sono motivato/a a utilizzarla quotidianamente anche nell'ambiente di lavoro.`,
        },
      ],

      cv: {
        title: `${name} — CV`,
        profile: `Persona motivata e responsabile interessata alla posizione di ${job}. Livello di italiano: ${italianLevel}. Disponibile ${availability}.`,

        experience: experience,

        skills: skills,

        availability: availability,

        note: cvName
          ? `CV caricato: ${cvName}`
          : "Nessun CV caricato. Il CV può essere creato automaticamente dai dati forniti.",
      },
    };

    return Response.json({
      success: true,
      mock: true,
      message: "Application pack generated successfully.",
      applicationPack,
    });
  } catch (error) {
    console.error("APPLICATION API ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}