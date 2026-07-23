// Daily Insight — bundled static content bank + on-device rotation.
// No server calls. Content ships in the app. Rotation tracked in localStorage.
// Cards are tagged by attachment_style and/or Big Five trait x level.
// A "general" bucket (no tags) is shown to every user.

import { traitLevel } from '@/lib/compatibilityQuiz';

// Each bucket: array of [en, fr] pairs. The builder assigns ids + tags.
const BUCKETS = [
  { key: 'general', tags: {}, cards: [
    ['Pause and notice three things you can feel right now.', 'Faites une pause et remarquez trois sensations que vous ressentez en ce moment.'],
    ['Connection begins with being present, not perfect.', 'La connexion commence par la présence, pas par la perfection.'],
    ['What is one small kindness you offered today?', 'Quelle petite gentillesse avez-vous offerte aujourd\u2019hui ?'],
    ['Your worth is not measured by someone else\u2019s attention.', 'Votre valeur ne se mesure pas à l\u2019attention des autres.'],
    ['Breathe in for four, hold for four, out for four.', 'Inspirez sur quatre, retenez sur quatre, expirez sur quatre.'],
    ['Curiosity about yourself is the beginning of intimacy.', 'La curiosité envers vous-même est le début de l\u2019intimité.'],
    ['Name one feeling you have not yet put into words today.', 'Nommez un ressenti que vous n\u2019avez pas encore exprimé aujourd\u2019hui.'],
    ['Love grows in small, consistent moments.', 'L\u2019amour grandit dans de petits moments réguliers.'],
    ['You are allowed to change your mind.', 'Vous avez le droit de changer d\u2019avis.'],
    ['Notice where you are holding tension, and soften it.', 'Remarquez où vous serrez, et détendez.'],
    ['Being seen starts with seeing yourself.', 'Être vu commence par se voir soi-même.'],
    ['What would you do today if you trusted yourself fully?', 'Que feriez-vous aujourd\u2019hui si vous aviez pleinement confiance en vous ?'],
    ['Rest is part of growth, not its opposite.', 'Le repos fait partie de la croissance, il ne s\u2019y oppose pas.'],
    ['A gentle boundary is still a boundary.', 'Une limite douce reste une limite.'],
    ['You can want connection and need space at the same time.', 'Vous pouvez désirer la connexion et avoir besoin d\u2019espace en même temps.'],
    ['Listening to yourself is a skill you can practice.', 'S\u2019écouter est une compétence que l\u2019on peut pratiquer.'],
    ['What is one thing you appreciate about yourself right now?', 'Qu\u2019appréciez-vous chez vous en ce moment ?'],
    ['Slowing down is not falling behind.', 'Ralentir n\u2019est pas prendre du retard.'],
    ['You do not have to earn closeness.', 'Vous n\u2019avez pas à mériter la proximité.'],
    ['Notice the quality of your thoughts this hour.', 'Remarquez la qualité de vos pensées cette heure-ci.'],
    ['Small honesty opens big doors.', 'Une petite honnêteté ouvre de grandes portes.'],
    ['You can be a work in progress and still worthy of love.', 'Vous pouvez être en chantier et digne d\u2019amour.'],
    ['Let someone know one true thing today.', 'Dites une chose vraie à quelqu\u2019un aujourd\u2019hui.'],
    ['Your feelings are information, not commands.', 'Vos émotions sont des informations, pas des ordres.'],
    ['Presence is the rarest gift you can give.', 'La présence est le plus rare des cadeaux.'],
    ['What story are you telling yourself right now?', 'Quelle histoire vous racontez-vous en ce moment ?'],
    ['Tenderness with yourself is not weakness.', 'La tendresse envers soi n\u2019est pas une faiblesse.'],
    ['You can hold hope and uncertainty together.', 'Vous pouvez porter l\u2019espoir et l\u2019incertitude ensemble.'],
    ['Noticing your breath is enough for this moment.', 'Remarquer votre souffle suffit pour cet instant.'],
    ['You are allowed to take up space.', 'Vous avez le droit d\u2019occuper de la place.'],
    ['What would tenderness look like right now?', 'À quoi ressemblerait la tendresse en ce moment ?'],
    ['Growth often looks like quieter choices.', 'La croissance ressemble souvent à des choix plus discrets.'],
    ['You can be honest without being harsh.', 'Vous pouvez être honnête sans être dur(e).'],
    ['Let today be enough.', 'Que ce jour suffise.'],
    ['Notice one thing you are grateful for, however small.', 'Remarquez une chose pour laquelle vous êtes reconnaissant(e), même petite.'],
    ['You are not behind.', 'Vous n\u2019êtes pas en retard.'],
    ['Connection is built in everyday attention.', 'La connexion se construit dans l\u2019attention quotidienne.'],
    ['You can ask for what you need.', 'Vous pouvez demander ce dont vous avez besoin.'],
    ['Being reachable is a gift, not a demand.', 'Être joignable est un cadeau, pas une exigence.'],
    ['You belong here.', 'Vous avez votre place ici.'],
  ]},
  { key: 'secure', tags: { attachment: ['secure'] }, cards: [
    ['Your ease with closeness is a quiet strength.', 'Votre aisance avec la proximité est une force discrète.'],
    ['Trust the part of you that can rest in connection.', 'Faites confiance à la part de vous qui se repose dans la connexion.'],
    ['You can offer presence without losing yourself.', 'Vous pouvez offrir votre présence sans vous perdre.'],
    ['Notice how you stay yourself even when close.', 'Remarquez comment vous restez vous-même même de près.'],
    ['Your trust is earned by your consistency.', 'Votre confiance se gagne par votre régularité.'],
    ['You can hold space for another without fixing.', 'Vous pouvez laisser de la place à l\u2019autre sans réparer.'],
    ['Closeness feels safe for you; let it nourish today.', 'La proximité vous rassure ; laissez-la vous nourrir aujourd\u2019hui.'],
    ['You can reach out and also return to center.', 'Vous pouvez tendre la main et aussi revenir à votre centre.'],
    ['Notice how you repair after a small rupture.', 'Remarquez comment vous vous réparez après un petit écart.'],
    ['Your calm invites calm in others.', 'Votre calme invite au calme chez l\u2019autre.'],
    ['You can miss someone and still feel whole.', 'Vous pouvez manquer quelqu\u2019un et rester entier(ère).'],
    ['Let yourself receive today, not only give.', 'Laissez-vous recevoir aujourd\u2019hui, pas seulement donner.'],
  ]},
  { key: 'anxious', tags: { attachment: ['anxious'] }, cards: [
    ['Notice the urge to check in, and let it breathe.', 'Remarquez l\u2019envie de vérifier, et laissez-la respirer.'],
    ['You are not your worry.', 'Vous n\u2019êtes pas votre inquiétude.'],
    ['Reassurance feels good; trust feels better.', 'La réassurance soulage ; la confiance libère.'],
    ['Pause before sending the message that seeks certainty.', 'Faites une pause avant d\u2019envoyer le message qui cherche la certitude.'],
    ['You can love someone and not track them.', 'Vous pouvez aimer quelqu\u2019un sans le surveiller.'],
    ['Your feelings matter; they are not emergencies.', 'Vos ressentis comptent ; ce ne sont pas des urgences.'],
    ['Notice when fear of loss is driving the wheel.', 'Remarquez quand la peur de perdre prend le volant.'],
    ['You can sit with not knowing.', 'Vous pouvez supporter de ne pas savoir.'],
    ['Being chosen does not require proving.', 'Être choisi ne demande pas de faire ses preuves.'],
    ['Ground yourself before seeking reassurance.', 'Ancrez-vous avant de chercher la réassurance.'],
    ['You are allowed to ask directly for what you need.', 'Vous avez le droit de demander directement ce dont vous avez besoin.'],
    ['Notice the difference between longing and longing for certainty.', 'Remarquez la différence entre désirer et désirer la certitude.'],
    ['Your attachment is not a flaw.', 'Votre attachement n\u2019est pas un défaut.'],
    ['You can soothe yourself before reaching out.', 'Vous pouvez vous apaiser avant de vous tourner vers l\u2019autre.'],
  ]},
  { key: 'avoidant', tags: { attachment: ['avoidant'] }, cards: [
    ['Notice the pull to withdraw, and let it be seen.', 'Remarquez l\u2019envie de vous retirer, et laissez-la être vue.'],
    ['Independence and closeness can coexist.', 'Indépendance et proximité peuvent coexister.'],
    ['You can let someone in without losing your center.', 'Vous pouvez laisser quelqu\u2019un entrer sans perdre votre centre.'],
    ['Notice when you manage feelings alone that could be shared.', 'Remarquez quand vous gérez seul(e) des ressentis qui pourraient être partagés.'],
    ['Asking for help is not dependence.', 'Demander de l\u2019aide n\u2019est pas de la dépendance.'],
    ['Let one small need be spoken today.', 'Laissez un petit besoin être exprimé aujourd\u2019hui.'],
    ['Closeness is not a threat to your freedom.', 'La proximité n\u2019est pas une menace à votre liberté.'],
    ['You can stay present without planning an exit.', 'Vous pouvez rester présent(e) sans prévoir une sortie.'],
    ['Notice the comfort you find in distance.', 'Remarquez le réconfort que vous trouvez dans la distance.'],
    ['Vulnerability is not weakness; it is a door.', 'La vulnérabilité n\u2019est pas une faiblesse ; c\u2019est une porte.'],
    ['You can be self-reliant and still let love in.', 'Vous pouvez être autonome et laisser entrer l\u2019amour.'],
    ['Let someone care for you today, however small.', 'Laissez quelqu\u2019un prendre soin de vous aujourd\u2019hui, même un peu.'],
    ['Your walls were protection; they can also be doors.', 'Vos murs vous protégeaient ; ils peuvent aussi devenir des portes.'],
    ['Notice what closeness asks of you, gently.', 'Remarquez, avec douceur, ce que la proximité vous demande.'],
  ]},
  { key: 'fearful', tags: { attachment: ['fearful'] }, cards: [
    ['You can long for closeness and fear it at once.', 'Vous pouvez désirer la proximité et la craindre à la fois.'],
    ['Notice the swing between reaching out and pulling back.', 'Remarquez le va-et-vient entre tendre la main et se retirer.'],
    ['Your hesitation is not a verdict on your worth.', 'Votre hésitation n\u2019est pas un verdict sur votre valeur.'],
    ['You can take one small step toward trust.', 'Vous pouvez faire un petit pas vers la confiance.'],
    ['Both your longing and your fear deserve kindness.', 'Votre désir et votre peur méritent chacun la gentillesse.'],
    ['Notice which voice speaks loudest right now.', 'Remarquez quelle voix parle le plus fort en ce moment.'],
    ['You are allowed to move slowly toward someone.', 'Vous avez le droit d\u2019avancer lentement vers quelqu\u2019un.'],
    ['Safety can be built in small, tested moments.', 'La sécurité se construit dans de petits moments éprouvés.'],
    ['You can name the fear without obeying it.', 'Vous pouvez nommer la peur sans lui obéir.'],
    ['Let today be one less push away.', 'Que ce jour soit un éloignement de moins.'],
    ['You can want love and protect yourself; both are true.', 'Vous pouvez vouloir l\u2019amour et vous protéger ; les deux sont vrais.'],
    ['Notice when you brace for hurt that hasn\u2019t come.', 'Remarquez quand vous vous armez pour une blessure qui n\u2019est pas venue.'],
    ['Tenderness toward your fear loosens its grip.', 'La tendresse envers votre peur desserre son emprise.'],
    ['You are allowed to stay and see what happens.', 'Vous avez le droit de rester et de voir ce qui se passe.'],
  ]},
  { key: 'openness_high', tags: { big5: [{ trait: 'openness', level: 'high' }] }, cards: [
    ['Let your imagination wander somewhere new today.', 'Laissez votre imagination vagabonder vers du neuf aujourd\u2019hui.'],
    ['An unfamiliar idea can be a gift, not a threat.', 'Une idée inconnue peut être un cadeau, pas une menace.'],
    ['Notice the beauty in something ordinary.', 'Remarquez la beauté dans quelque chose d\u2019ordinaire.'],
    ['Your curiosity is a form of courage.', 'Votre curiosité est une forme de courage.'],
    ['Try one new thing, however small.', 'Essayez une chose nouvelle, aussi petite soit-elle.'],
    ['Let a question stay open longer than usual.', 'Laissez une question ouverte plus longtemps que d\u2019habitude.'],
    ['You can hold two truths at once.', 'Vous pouvez tenir deux vérités à la fois.'],
    ['Wonder is a renewable resource; spend it freely.', 'L\u2019émerveillement est renouvelable ; dépensez-le librement.'],
    ['Notice what surprises you today.', 'Remarquez ce qui vous surprend aujourd\u2019hui.'],
    ['Your openness to change is a quiet superpower.', 'Votre ouverture au changement est un super-pouvoir discret.'],
    ['Let yourself be moved by art or nature.', 'Laissez-vous émouvoir par l\u2019art ou la nature.'],
    ['A new perspective can soften an old wound.', 'Un nouveau regard peut adoucir une vieille blessure.'],
    ['You can dream and still stay grounded.', 'Vous pouvez rêver et rester ancré(e).'],
    ['Follow one thread of curiosity today.', 'Suivez un fil de curiosité aujourd\u2019hui.'],
  ]},
  { key: 'openness_low', tags: { big5: [{ trait: 'openness', level: 'low' }] }, cards: [
    ['Familiar rhythms can be deeply comforting.', 'Les routines familières peuvent être profondément réconfortantes.'],
    ['You do not need novelty to grow.', 'Vous n\u2019avez pas besoin de nouveauté pour grandir.'],
    ['Notice what you already love, and deepen it.', 'Remarquez ce que vous aimez déjà, et approfondissez-le.'],
    ['Stability is its own kind of adventure.', 'La stabilité est sa propre forme d\u2019aventure.'],
    ['Let what is known be enough today.', 'Que le connu suffise aujourd\u2019hui.'],
    ['Your steadiness is a gift to those around you.', 'Votre constance est un cadeau pour votre entourage.'],
    ['Depth can matter more than breadth.', 'La profondeur peut compter plus que l\u2019étendue.'],
    ['Notice the comfort in a known routine.', 'Remarquez le réconfort d\u2019une routine connue.'],
    ['You can grow within the familiar.', 'Vous pouvez grandir dans le familier.'],
    ['Tradition can hold wisdom worth keeping.', 'La tradition porte une sagesse qui mérite d\u2019être gardée.'],
    ['Let yourself savor the present without seeking more.', 'Savourez le présent sans chercher davantage.'],
    ['Consistency builds quiet mastery.', 'La régularité bâtit une maîtrise discrète.'],
  ]},
  { key: 'conscientiousness_high', tags: { big5: [{ trait: 'conscientiousness', level: 'high' }] }, cards: [
    ['Notice the satisfaction in a task completed.', 'Remarquez la satisfaction d\u2019une tâche accomplie.'],
    ['You can rest without earning it.', 'Vous pouvez vous reposer sans le mériter.'],
    ['Let one detail go today, on purpose.', 'Laissez un détail partir aujourd\u2019hui, volontairement.'],
    ['Your follow-through is a quiet act of care.', 'Votre ténacité est un acte discret d\u2019attention.'],
    ['Done can matter more than perfect.', 'Fait peut compter plus que parfait.'],
    ['Notice when striving becomes strain.', 'Remarquez quand l\u2019effort devient tension.'],
    ['You can keep your standards and your softness.', 'Vous pouvez garder vos exigences et votre douceur.'],
    ['Let progress, not perfection, be the measure.', 'Que la progression, non la perfection, soit la mesure.'],
    ['Plan a small rest as carefully as you plan work.', 'Planifiez un petit repos aussi soigneusement que votre travail.'],
    ['Your reliability is a form of love.', 'Votre fiabilité est une forme d\u2019amour.'],
    ['Notice what you have already built.', 'Remarquez ce que vous avez déjà bâti.'],
    ['You can loosen the grip and still be trusted.', 'Vous pouvez desserrer la prise et rester digne de confiance.'],
    ['A finished small thing beats a perfect imagined one.', 'Une petite chose finie vaut mieux qu\u2019une grande imaginée parfaite.'],
    ['Let yourself be proud of the ordinary effort.', 'Soyez fier(ère) de l\u2019effort ordinaire.'],
  ]},
  { key: 'conscientiousness_low', tags: { big5: [{ trait: 'conscientiousness', level: 'low' }] }, cards: [
    ['One small step counts as starting.', 'Un petit pas compte comme un début.'],
    ['You can begin before you feel ready.', 'Vous pouvez commencer avant de vous sentir prêt(e).'],
    ['Notice the freedom in your flexibility.', 'Remarquez la liberté de votre flexibilité.'],
    ['Let go of the guilt of unfinished lists.', 'Déposez la culpabilité des listes inachevées.'],
    ['Pick one thing, and let it be enough.', 'Choisissez une chose, et que ce soit suffisant.'],
    ['Spontaneity has its own wisdom.', 'La spontanéité a sa propre sagesse.'],
    ['You can move without a plan.', 'Vous pouvez avancer sans plan.'],
    ['Notice what truly matters, and let the rest wait.', 'Remarquez ce qui compte vraiment, et laissez le reste attendre.'],
    ['Small consistent beats large occasional.', 'Régulier et petit bat grand et occasionnel.'],
    ['Let ease be a valid guide.', 'Que la facilité soit un guide valable.'],
    ['You are not your to-do list.', 'Vous n\u2019êtes pas votre liste de tâches.'],
    ['Begin again, kindly.', 'Recommencez, avec douceur.'],
  ]},
  { key: 'extraversion_high', tags: { big5: [{ trait: 'extraversion', level: 'high' }] }, cards: [
    ['Notice how energy moves when you connect.', 'Remarquez comment l\u2019énergie circule quand vous reliez.'],
    ['You can shine and still need rest.', 'Vous pouvez briller et avoir besoin de repos.'],
    ['Let one conversation deepen today.', 'Laissez une conversation s\u2019approfondir aujourd\u2019hui.'],
    ['Your warmth is a gift; guard your energy too.', 'Votre chaleur est un cadeau ; préservez aussi votre énergie.'],
    ['Notice when social ease hides a tender feeling.', 'Remarquez quand l\u2019aisance sociale cache un ressenti tendre.'],
    ['You can be the life and still sit one out.', 'Vous pouvez être l\u2019âme et rater une fête.'],
    ['Let silence visit you between conversations.', 'Laissez le silence vous visiter entre deux conversations.'],
    ['Your enthusiasm draws people in.', 'Votre enthousiasme attire les gens.'],
    ['Notice who recharges you and who drains you.', 'Remarquez qui vous recharge et qui vous vide.'],
    ['You can turn the spark inward for a moment.', 'Vous pouvez tourner l\u2019étincelle vers l\u2019intérieur un instant.'],
    ['Sharing joy doubles it.', 'Partager la joie la double.'],
    ['Let yourself be seen beyond the energy.', 'Laissez-vous voir au-delà de l\u2019énergie.'],
    ['Connection is your element; rest keeps it sustainable.', 'La connexion est votre élément ; le repos la rend durable.'],
    ['Notice the quiet after the noise.', 'Remarquez le calme après le bruit.'],
  ]},
  { key: 'extraversion_low', tags: { big5: [{ trait: 'extraversion', level: 'low' }] }, cards: [
    ['Your quiet presence is a form of depth.', 'Votre présence discrète est une forme de profondeur.'],
    ['Notice what recharges you, and protect it.', 'Remarquez ce qui vous recharge, et protégez-le.'],
    ['You can connect one-on-one and call it enough.', 'Vous pouvez lier en tête-à-tête et que ce soit suffisant.'],
    ['Solitude is not the same as loneliness.', 'La solitude n\u2019est pas la même chose que l\u2019isolement.'],
    ['Let one small social step be enough today.', 'Qu\u2019un petit pas social suffise aujourd\u2019hui.'],
    ['Your listening changes people.', 'Votre écoute change les gens.'],
    ['Notice the richness of your inner world.', 'Remarquez la richesse de votre monde intérieur.'],
    ['You can be warm without being loud.', 'Vous pouvez être chaleureux(se) sans être bruyant(e).'],
    ['Depth often speaks softly.', 'La profondeur parle souvent doucement.'],
    ['Let yourself emerge at your own pace.', 'Laissez-vous émerger à votre rythme.'],
    ['Your calm steadies a room.', 'Votre calme stabilise une pièce.'],
    ['Notice how much you give in quiet ways.', 'Remarquez combien vous donnez en silence.'],
  ]},
  { key: 'agreeableness_high', tags: { big5: [{ trait: 'agreeableness', level: 'high' }] }, cards: [
    ['Your kindness is a strength; let it include you.', 'Votre gentillesse est une force ; qu\u2019elle vous inclue.'],
    ['Notice when you say yes and mean maybe.', 'Remarquez quand vous dites oui en pensant peut-être.'],
    ['You can care without carrying it all.', 'Vous pouvez vous soucier sans tout porter.'],
    ['Let one boundary be spoken kindly today.', 'Qu\u2019une limite soit dite avec douceur aujourd\u2019hui.'],
    ['Your harmony-seeking is a gift; honesty protects it.', 'Votre quête d\u2019harmonie est un cadeau ; l\u2019honnêteté la protège.'],
    ['Notice when you absorb a feeling that isn\u2019t yours.', 'Remarquez quand vous absorbez un ressenti qui n\u2019est pas le vôtre.'],
    ['You can disagree and still be loved.', 'Vous pouvez être en désaccord et rester aimé(e).'],
    ['Let yourself receive the care you give.', 'Laissez-vous recevoir le soin que vous donnez.'],
    ['Tenderness includes tenderness for yourself.', 'La tendresse inclut la tendresse envers vous-même.'],
    ['Notice when pleasing others costs you.', 'Remarquez quand plaire aux autres vous coûte.'],
    ['Your empathy is not endless; refill it.', 'Votre empathie n\u2019est pas infinie ; remplissez-la.'],
    ['You can say no with love.', 'Vous pouvez dire non avec amour.'],
    ['Being good to others includes being good to you.', 'Être bon(ne) envers les autres inclut l\u2019être envers vous.'],
    ['Let your needs sit at the same table.', 'Que vos besoins s\u2019assoient à la même table.'],
  ]},
  { key: 'agreeableness_low', tags: { big5: [{ trait: 'agreeableness', level: 'low' }] }, cards: [
    ['Your directness can be a form of care.', 'Votre franchise peut être une forme d\u2019attention.'],
    ['You can hold your ground and still be kind.', 'Vous pouvez tenir votre position et rester bienveillant(e).'],
    ['Notice when honesty serves more than harmony.', 'Remarquez quand l\u2019honnêteté sert plus que l\u2019harmonie.'],
    ['Your independence keeps relationships honest.', 'Votre indépendance garde les relations honnêtes.'],
    ['You can disagree without distance.', 'Vous pouvez être en désaccord sans prendre distance.'],
    ['Let one critique be offered constructively.', 'Qu\u2019une critique soit offerte de façon constructive.'],
    ['Candor builds trust when paired with care.', 'La franchise bâtit la confiance quand elle est soignée.'],
    ['Notice when you can soften without losing yourself.', 'Remarquez quand vous pouvez vous adoucir sans vous perdre.'],
    ['You can advocate for yourself today.', 'Vous pouvez défendre votre intérêt aujourd\u2019hui.'],
    ['Principles and warmth can share a voice.', 'Principes et chaleur peuvent partager une voix.'],
    ['Let empathy inform, not replace, your judgment.', 'Que l\u2019empathie informe, sans remplacer, votre jugement.'],
    ['Being kind does not require agreeing.', 'Être gentil(le) ne demande pas d\u2019être d\u2019accord.'],
  ]},
  { key: 'neuroticism_high', tags: { big5: [{ trait: 'neuroticism', level: 'high' }] }, cards: [
    ['Notice the worry, then return to now.', 'Remarquez l\u2019inquiétude, puis revenez au maintenant.'],
    ['Your feelings are valid and also passing.', 'Vos ressentis sont valables et aussi passagers.'],
    ['You can feel a lot and still be steady.', 'Vous pouvez beaucoup ressentir et rester stable.'],
    ['Let one anxious thought meet a gentle question.', 'Qu\u2019une pensée anxieuse rencontre une question douce.'],
    ['Notice where tension lives, and breathe into it.', 'Remarquez où vit la tension, et respirez dedans.'],
    ['You are not your worst-case scenario.', 'Vous n\u2019êtes pas votre pire scénario.'],
    ['Let the feeling be named, not obeyed.', 'Que le ressenti soit nommé, pas obéi.'],
    ['Ground your feet; the present is still here.', 'Ancrez vos pieds ; le présent est encore là.'],
    ['Notice the story under the worry.', 'Remarquez l\u2019histoire sous l\u2019inquiétude.'],
    ['You can hold intensity without being swept away.', 'Vous pouvez porter l\u2019intensité sans être emporté(e).'],
    ['Let one small comfort be enough.', 'Qu\u2019un petit réconfort suffise.'],
    ['Your sensitivity is also your depth.', 'Votre sensibilité est aussi votre profondeur.'],
    ['Notice when a feeling asks for a fact check.', 'Remarquez quand un ressenti réclame une vérification.'],
    ['You can feel afraid and still act gently.', 'Vous pouvez avoir peur et agir avec douceur.'],
    ['Let the breath be longer than the thought.', 'Que le souffle soit plus long que la pensée.'],
    ['You are allowed to ask for support today.', 'Vous avez le droit de demander du soutien aujourd\u2019hui.'],
  ]},
  { key: 'neuroticism_low', tags: { big5: [{ trait: 'neuroticism', level: 'low' }] }, cards: [
    ['Your steadiness is a quiet gift to others.', 'Votre stabilité est un cadeau discret pour les autres.'],
    ['Notice the calm you carry, and let it be enough.', 'Remarquez le calme que vous portez, et que ce soit suffisant.'],
    ['You can hold space for others\u2019 intensity.', 'Vous pouvez laisser de la place à l\u2019intensité des autres.'],
    ['Let ease be named and appreciated.', 'Que la facilité soit nommée et appréciée.'],
    ['Your evenness is not the same as numbness.', 'Votre équanimité n\u2019est pas l\u2019engourdissement.'],
    ['Notice what helps you return to calm.', 'Remarquez ce qui vous ramène au calme.'],
    ['You can be a steady harbor.', 'Vous pouvez être un port stable.'],
    ['Let yourself feel deeply without the storm.', 'Laissez-vous ressentir profondément sans la tempête.'],
    ['Your peace can hold room for others\u2019 pain.', 'Votre paix peut laisser de la place à la douleur des autres.'],
    ['Notice the small joys you might overlook.', 'Remarquez les petites joies que vous pourriez négliger.'],
    ['You can invite calm without dismissing feeling.', 'Vous pouvez inviter le calme sans écarter le ressenti.'],
    ['Let your steadiness be a kindness, not a wall.', 'Que votre stabilité soit une gentillesse, pas un mur.'],
  ]},
];

// Build the flat bank
export const INSIGHT_CARDS = (() => {
  const out = [];
  for (const bucket of BUCKETS) {
    bucket.cards.forEach((pair, i) => {
      out.push({
        id: `di_${bucket.key}_${i}`,
        en: pair[0],
        fr: pair[1],
        attachment: bucket.tags.attachment || [],
        big5: bucket.tags.big5 || [],
      });
    });
  }
  return out;
})();

const BANK_BY_ID = Object.fromEntries(INSIGHT_CARDS.map((c) => [c.id, c]));

const BIG5_KEYS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

// Derive the user's tags from their Compatibility Profile data.
export function getUserTags(profile) {
  const attachment = profile?.attachment_style || null;
  const big5 = {};
  for (const trait of BIG5_KEYS) {
    const raw = profile?.[`big5_${trait}`];
    if (raw != null && !Number.isNaN(raw)) big5[trait] = traitLevel(raw);
  }
  return { attachment, big5 };
}

function cardMatches(card, tags) {
  // General cards (no tags) always match.
  if (!card.attachment.length && !card.big5.length) return true;
  if (tags.attachment && card.attachment.includes(tags.attachment)) return true;
  for (const t of card.big5) {
    const userLevel = tags.big5[t.trait];
    // Moderate matches both high and low for that trait, so no one is left out.
    if (userLevel && (userLevel === t.level || userLevel === 'moderate')) return true;
  }
  return false;
}

export function getFilteredBank(profile) {
  const tags = getUserTags(profile);
  return INSIGHT_CARDS.filter((c) => cardMatches(c, tags));
}

// ── On-device rotation state ──
const STATE_KEY = 'nina_daily_insight_state_v1';

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function readState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { seen: s.seen || [], current: s.current || null, lastDate: s.lastDate || null, count: s.count || 0 };
    }
  } catch {}
  return { seen: [], current: null, lastDate: null, count: 0 };
}

function writeState(s) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
}

// Serve today's card. Idempotent within a calendar day; advances once per day.
// Returns { card, isNewDay }.
export function getTodayInsight(profile) {
  const today = todayStr();
  const filtered = getFilteredBank(profile);
  if (!filtered.length) return { card: null, isNewDay: false };

  const state = readState();

  // Same day, current still valid in the bank → return it unchanged.
  if (state.lastDate === today && state.current && BANK_BY_ID[state.current]) {
    return { card: BANK_BY_ID[state.current], isNewDay: false };
  }

  // New day (or first run): pick the next unseen card in the filtered pool.
  let seen = state.seen.filter((id) => filtered.some((c) => c.id === id));
  let unseen = filtered.filter((c) => !seen.includes(c.id));
  if (!unseen.length) { seen = []; unseen = filtered; } // pool exhausted → recycle
  const next = unseen[0];
  seen.push(next.id);

  const newState = {
    seen,
    current: next.id,
    lastDate: today,
    count: (state.count || 0) + 1,
  };
  writeState(newState);
  return { card: next, isNewDay: true };
}

export function getCumulativeCount() {
  return readState().count || 0;
}

export function getCardById(id) {
  return BANK_BY_ID[id] || null;
}