import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, Upload, Mail, Lock, Eye, EyeOff, Loader2, X, Shield, Heart, AlertCircle, RefreshCw } from 'lucide-react';
import NinaSpeech from '@/components/NinaSpeech';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import PhoneInput from '@/components/PhoneInput';
import CoupleSegmentation from '@/components/onboarding/CoupleSegmentation';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/ThemeContext';
import { base44 } from '@/api/base44Client';
import { ALL_PLANS } from '@/lib/plans';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import AppleIcon from '@/components/AppleIcon';
import MicrosoftIcon from '@/components/MicrosoftIcon';
import { ninaIcon, ninaCharacter } from '@/lib/images';

// Steps: age → guidelines → segmentation → profile → archetype → photos → questions → subscription → register → complete
const STEPS = ['age', 'guidelines', 'segmentation', 'profile', 'archetype', 'photos', 'questions', 'orientation', 'subscription', 'complete'];

const ORIENTATION_VERSION = '1.0';

export const QUESTIONS_21 = [
  { key: 'q11_core_values', en: 'What are your core values?', fr: 'Quelles sont vos valeurs fondamentales ?', options_en: ['a) Honesty and integrity', 'b) Compassion and empathy', 'c) Ambition and achievement', 'd) Adventure and spontaneity'], options_fr: ['a) Honnêteté et intégrité', 'b) Compassion et empathie', 'c) Ambition et réussite', 'd) Aventure et spontanéité'], opt_keys: ['a','b','c','d'] },
  { key: 'q12_success', en: 'How do you define success?', fr: 'Comment définissez-vous le succès ?', options_en: ['a) Financial stability and career advancement', 'b) Personal fulfillment and happiness', 'c) Making a positive impact on others', 'd) Continuous growth and self-improvement'], options_fr: ['a) Stabilité financière et évolution professionnelle', 'b) Épanouissement personnel et bonheur', 'c) Avoir un impact positif sur les autres', 'd) Croissance continue et amélioration de soi'], opt_keys: ['a','b','c','d'] },
  { key: 'q13_conflict', en: 'How do you handle conflicts or disagreements?', fr: 'Comment gérez-vous les conflits ou désaccords ?', options_en: ['a) Open communication and compromise', 'b) Taking time to cool off before discussing', 'c) Seeking a win-win solution', 'd) Avoiding conflicts altogether'], options_fr: ['a) Communication ouverte et compromis', "b) Prendre du recul avant d'en parler", 'c) Chercher une solution gagnant-gagnant', 'd) Éviter les conflits'], opt_keys: ['a','b','c','d'] },
  { key: 'q14_spirituality', en: 'What role does spirituality or religion play in your life?', fr: 'Quel rôle joue la spiritualité ou la religion dans votre vie ?', options_en: ['a) Central part of my life and decision-making', 'b) Provides guidance and moral compass', 'c) Not important to me personally', 'd) Still exploring and defining my beliefs'], options_fr: ['a) Partie centrale de ma vie et de mes décisions', 'b) Un guide et une boussole morale', 'c) Pas important pour moi personnellement', "d) J'explore encore mes croyances"], opt_keys: ['a','b','c','d'] },
  { key: 'q15_personal_growth', en: 'How important is personal growth and self-development to you?', fr: 'Quelle importance accordez-vous à la croissance personnelle ?', options_en: ['a) Extremely important; always seeking self-improvement', 'b) Somewhat important; I take it at my own pace', "c) Not a priority; I'm content with who I am", "d) Unsure; still figuring out my approach"], options_fr: ["a) Extrêmement important; je cherche toujours à m'améliorer", 'b) Assez important, à mon rythme', 'c) Pas une priorité; je suis satisfait(e) de qui je suis', "d) Incertain(e); je cherche encore"], opt_keys: ['a','b','c','d'] },
  { key: 'q16_stress', en: 'How do you handle stress and prioritize self-care?', fr: 'Comment gérez-vous le stress et prenez-vous soin de vous ?', options_en: ['a) Engage in regular exercise and self-care practices', 'b) Seek support from loved ones or professionals', 'c) Get immersed in hobbies or activities I enjoy', 'd) I struggle with managing stress and self-care'], options_fr: ['a) Exercice régulier et pratiques de bien-être', 'b) Je cherche le soutien de proches ou de professionnels', 'c) Je me plonge dans des loisirs', "d) J'ai du mal à gérer le stress"], opt_keys: ['a','b','c','d'] },
  { key: 'q17_living_env', en: 'How do you envision your ideal living environment?', fr: 'Comment imaginez-vous votre environnement de vie idéal ?', options_en: ['a) Urban city life with lots of activities and opportunities', 'b) Peaceful suburban or rural setting close to nature', 'c) A mix of both, depending on my mood', "d) I'm flexible and open to different environments"], options_fr: ['a) Vie urbaine dynamique', 'b) Cadre paisible, proche de la nature', "c) Un mélange des deux selon mon humeur", "d) Flexible et ouvert(e) à tout environnement"], opt_keys: ['a','b','c','d'] },
  { key: 'q18_family', en: 'How important is family to you?', fr: 'Quelle importance accordez-vous à la famille ?', options_en: ["a) Family is my top priority and I'm very close to them", 'b) Family is important, but so are personal goals', 'c) Neutral; I also value independence', "d) Not a priority; I have a different definition of family"], options_fr: ['a) La famille est ma priorité absolue', 'b) La famille est importante, tout comme mes objectifs personnels', "c) Neutre; j'accorde aussi de la valeur à l'indépendance", "d) Pas une priorité; j'ai une vision différente de la famille"], opt_keys: ['a','b','c','d'] },
  { key: 'q19_work_life', en: 'How do you approach work-life balance?', fr: "Comment abordez-vous l'équilibre travail-vie personnelle ?", options_en: ['a) Strive for a healthy balance between work and personal life', 'b) Work is a top priority; personal life takes a backseat', 'c) Personal life is more important than work', 'd) I struggle to maintain a balance'], options_fr: ["a) Je m'efforce d'avoir un équilibre sain", 'b) Le travail est prioritaire', 'c) La vie personnelle est plus importante que le travail', "d) J'ai du mal à maintenir cet équilibre"], opt_keys: ['a','b','c','d'] },
  { key: 'q20_relationship_goal', en: 'What are your long-term relationship goals?', fr: 'Quels sont vos objectifs relationnels à long terme ?', options_en: ['a) Companionship and building a life together', 'b) Marriage and starting a family', 'c) Exploring a non-traditional or open relationship', "d) Uncertain; still figuring out my long-term goals"], options_fr: ['a) Complicité et construire une vie ensemble', 'b) Mariage et fonder une famille', 'c) Explorer une relation non traditionnelle', "d) Incertain(e); je cherche encore"], opt_keys: ['a','b','c','d'] },
  { key: 'q21_money', en: 'How do you handle money and financial responsibilities?', fr: "Comment gérez-vous l'argent et les responsabilités financières ?", options_en: ['a) Budgeting and saving for the future are important to me', "b) I'm comfortable spending and enjoying the present", "c) I'm not particularly focused on financial matters", "d) I struggle with managing money and need guidance"], options_fr: ["a) Le budget et l'épargne sont importants pour moi", 'b) Je dépense et profite du présent', 'c) Je ne me concentre pas vraiment sur les finances', "d) J'ai du mal à gérer l'argent"], opt_keys: ['a','b','c','d'] },
  { key: 'q22_gender_roles', en: 'How do you view gender roles in a relationship?', fr: 'Comment percevez-vous les rôles de genre dans une relation ?', options_en: ['a) Embrace traditional gender roles', 'b) Prefer a more egalitarian approach', 'c) Open to discussing and finding a balance', "d) Unsure; still exploring my views"], options_fr: ["a) J'adhère aux rôles de genre traditionnels", "b) Je préfère une approche égalitaire", "c) Ouvert(e) à en discuter", "d) Incertain(e); j'explore encore"], opt_keys: ['a','b','c','d'] },
  { key: 'q23_leisure', en: 'How do you spend your leisure time?', fr: 'Comment occupez-vous votre temps libre ?', options_en: ['a) Engaging in physical activities and outdoor adventures', 'b) Pursuing creative hobbies and artistic interests', 'c) Relaxing at home with a book or a movie', 'd) Socializing with friends and exploring new places'], options_fr: ['a) Activités physiques et aventures en plein air', 'b) Loisirs créatifs et artistiques', 'c) Me détendre chez moi avec un livre ou un film', 'd) Socialiser et explorer de nouveaux endroits'], opt_keys: ['a','b','c','d'] },
  { key: 'q24_communication', en: 'How do you define and practice effective communication?', fr: 'Comment définissez-vous et pratiquez-vous une communication efficace ?', options_en: ['a) Active listening and expressing thoughts openly and honestly', 'b) Keeping emotions in check and maintaining a calm demeanor', 'c) Non-verbal cues and understanding body language', 'd) I struggle with effective communication'], options_fr: ["a) Écoute active et expression ouverte et honnête", 'b) Maîtriser ses émotions et rester calme', 'c) Signaux non verbaux et langage corporel', "d) J'ai du mal à communiquer efficacement"], opt_keys: ['a','b','c','d'] },
  { key: 'q25_intellectual', en: 'How important is intellectual stimulation and shared interests?', fr: 'Quelle importance accordez-vous à la stimulation intellectuelle et aux intérêts communs ?', options_en: ['a) Extremely important; I seek mental stimulation and connection', "b) Moderately important; I enjoy shared interests but it's not a must", 'c) Not a priority; I focus more on emotional connection', "d) Unsure; still figuring out my preferences"], options_fr: ['a) Extrêmement important; je cherche la stimulation mentale', 'b) Modérément important; les intérêts communs sont appréciés', "c) Pas une priorité; je privilégie la connexion émotionnelle", "d) Incertain(e); j'explore encore"], opt_keys: ['a','b','c','d'] },
  { key: 'q26_boundaries', en: "How do you approach personal boundaries and respect others'?", fr: 'Comment abordez-vous les limites personnelles ?', options_en: ["a) I communicate my boundaries clearly and respect others'", "b) I adapt to others' boundaries without asserting my own", 'c) I struggle to establish and maintain personal boundaries', "d) I'm still learning about boundaries and their importance"], options_fr: ['a) Je communique clairement mes limites et respecte celles des autres', "b) Je m'adapte aux limites des autres sans affirmer les miennes", "c) J'ai du mal à établir et maintenir mes limites", "d) J'apprends encore l'importance des limites"], opt_keys: ['a','b','c','d'] },
  { key: 'q27_change', en: 'How do you handle change and adapt to new situations?', fr: 'Comment gérez-vous le changement et les nouvelles situations ?', options_en: ['a) Embrace change and see it as an opportunity for growth', 'b) Feel uncomfortable with change but try to adapt', 'c) Prefer stability and resist change whenever possible', 'd) I find it difficult to handle change and need support'], options_fr: ["a) J'embrasse le changement comme une opportunité de croissance", "b) Je me sens mal à l'aise mais j'essaie de m'adapter", 'c) Je préfère la stabilité et résiste au changement', "d) J'ai du mal à gérer le changement"], opt_keys: ['a','b','c','d'] },
  { key: 'q28_diversity', en: 'How do you handle personal differences and diversity of opinions?', fr: 'Comment gérez-vous les différences et la diversité des opinions ?', options_en: ['a) Respect and appreciate different perspectives', "b) Engage in healthy debates to understand others' viewpoints", 'c) Avoid discussing sensitive topics to prevent conflicts', 'd) I struggle to accept differing opinions'], options_fr: ['a) Je respecte et apprécie les perspectives différentes', 'b) Je participe à des débats sains', "c) J'évite les sujets sensibles pour prévenir les conflits", "d) J'ai du mal à accepter les opinions différentes"], opt_keys: ['a','b','c','d'] },
  { key: 'q29_activism', en: 'How important is social activism and making a difference?', fr: "Quelle importance accordez-vous à l'activisme social ?", options_en: ['a) Actively involved in social causes and making an impact', 'b) Supportive of social causes but not actively engaged', 'c) Not a priority for me; I focus more on personal matters', 'd) Still exploring my views and potential involvement'], options_fr: ['a) Activement impliqué(e) dans des causes sociales', 'b) Favorable aux causes sociales sans engagement actif', 'c) Pas une priorité; je me concentre sur le personnel', "d) J'explore encore mes positions"], opt_keys: ['a','b','c','d'] },
  { key: 'q30_emotional_intimacy', en: 'How do you define and practice emotional intimacy?', fr: "Comment définissez-vous et pratiquez-vous l'intimité émotionnelle ?", options_en: ['a) Openly express emotions and create a safe space for vulnerability', 'b) Feel more comfortable with emotional self-sufficiency', 'c) Emotional intimacy is important, but it develops slowly for me', 'd) I struggle with emotional intimacy and need guidance'], options_fr: ["a) J'exprime ouvertement mes émotions et crée un espace sûr", "b) Je suis plus à l'aise avec l'autosuffisance émotionnelle", 'c) L\'intimité émotionnelle est importante mais se développe lentement chez moi', "d) J'ai du mal avec l'intimité émotionnelle"], opt_keys: ['a','b','c','d'] },
  { key: 'q31_partner_growth', en: "How do you approach personal growth and support your partner's growth?", fr: 'Comment abordez-vous la croissance personnelle et celle de votre partenaire ?', options_en: ['a) Encourage and support personal growth for both myself and my partner', 'b) Focus on my own personal growth and expect the same from my partner', "c) Growth is an individual journey; I respect my partner's choices", "d) Unsure; I'm still figuring out my approach"], options_fr: ["a) J'encourage et soutiens la croissance mutuelle", 'b) Je me concentre sur ma propre croissance et attends de même', "c) La croissance est un voyage individuel; je respecte les choix de l'autre", "d) Incertain(e); je cherche encore mon approche"], opt_keys: ['a','b','c','d'] },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [profile, setProfile] = useState({ first_name: '', middle_name: '', last_name: '', display_name: '', city: '', country: '', birthdate: '', sexual_orientation: '', gender_pronoun: '', relationship_status: '' });
  const [archetype, setArchetype] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('nina_membership');
  const [selectedDuration, setSelectedDuration] = useState('1m');
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ageError, setAgeError] = useState('');
  const [photos, setPhotos] = useState([null, null, null, null, null, null]);
  const [photoFingerprints, setPhotoFingerprints] = useState([null, null, null, null, null, null]);
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [formError, setFormError] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [locationValid, setLocationValid] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [profileType, setProfileType] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerLinkSent, setPartnerLinkSent] = useState(false);
  const [orientationAccepted, setOrientationAccepted] = useState(false);
  const [isAuthed, setIsAuthed] = useState(true);
  const [guardState, setGuardState] = useState('loading'); // 'loading' | 'show' | 'error'

  // Registration state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Pre-fill from an existing (admin-migrated) profile so the user doesn't
  // re-enter data the admin already provided. Runs once on mount.
  useEffect(() => {
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!authed) {
          navigate('/register?next=/onboarding', { replace: true });
          return;
        }
        const me = await base44.auth.me();
        setIsAuthed(true);

        // Check onboarding status — redirect completed users to /home
        try {
          const statusRes = await base44.functions.invoke('getOnboardingStatus', {});
          if (statusRes.data?.onboarding_status === 'complete') {
            navigate('/home', { replace: true });
            return;
          }
        } catch (statusErr) {
          console.warn('Onboarding status check failed:', statusErr.message);
        }

        // Pre-fill from existing profile (resume progress)
        const existing = await base44.entities.UserProfile.filter({ user_id: me.id });
        if (existing.length) {
          const p = existing[0];
          const nameParts = (p.full_name || '').split(' ').filter(Boolean);
          setProfile(prev => ({
            ...prev,
            first_name: prev.first_name || nameParts[0] || '',
            middle_name: prev.middle_name || (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''),
            last_name: prev.last_name || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''),
            display_name: prev.display_name || p.display_name || '',
            city: prev.city || p.city || '',
            country: prev.country || p.country || '',
            birthdate: prev.birthdate || p.birthdate || '',
            sexual_orientation: prev.sexual_orientation || '',
            gender_pronoun: prev.gender_pronoun || '',
            relationship_status: prev.relationship_status || '',
          }));
          if (p.dating_archetype) setArchetype(a => a || p.dating_archetype);
          if (p.phone) setPhone(v => v || p.phone);
          if (p.profile_type) setProfileType(p.profile_type);
          if (p.partner_email) setPartnerEmail(p.partner_email);

          // Pre-fill photos
          if (p.photos && p.photos.length) {
            setPhotos(prev => {
              const next = [...prev];
              p.photos.forEach((url, i) => { if (i < 6) next[i] = url; });
              return next;
            });
          }

          // Pre-fill answers
          const existingAnswers = await base44.entities.MatchingAnswers.filter({ user_id: me.id });
          if (existingAnswers.length) {
            setAnswers(prev => ({ ...prev, ...existingAnswers[0] }));
          }

          // Restore step
          if (p.onboarding_step) {
            const stepIndex = STEPS.indexOf(p.onboarding_step);
            if (stepIndex > 0) setStep(stepIndex);
          }
        }

        setGuardState('show');
      } catch (e) {
        console.error('Onboarding guard failed:', e);
        setGuardState('error');
      }
    })();
  }, []);

  const currentStep = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  const isOver18 = (birthdate) => {
    if (!birthdate) return false;
    const dob = new Date(birthdate);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    return age > 18 || (age === 18 && (m > 0 || (m === 0 && today.getDate() >= dob.getDate())));
  };

  const goNext = () => {
    // Save progress at key data-entry steps
    if (['profile', 'archetype', 'photos', 'questions', 'orientation'].includes(currentStep)) {
      saveProgress(STEPS[Math.min(step + 1, STEPS.length - 1)]);
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const goPrev = () => setStep(s => Math.max(s - 1, 0));
  const allQuestionsAnswered = QUESTIONS_21.every(q => answers[q.key]);

  const handleAnswer = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));

  // Save partial progress so refresh or connection loss doesn't erase work.
  // Fire-and-forget — non-blocking, errors are logged but never break the flow.
  const saveProgress = async (stepName) => {
    try {
      const user = await base44.auth.me();
      const composedFullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ').trim();
      await base44.functions.invoke('createProfile', {
        full_name: composedFullName,
        display_name: profile.display_name.trim() || composedFullName || user.full_name,
        city: profile.city,
        country: profile.country,
        birthdate: profile.birthdate,
        phone: phone,
        sexual_orientation: profile.sexual_orientation,
        gender_pronoun: profile.gender_pronoun,
        relationship_status: profile.relationship_status,
        dating_archetype: archetype,
        photos: photos.filter(Boolean),
        onboarding_status: 'in_progress',
        onboarding_complete: false,
        onboarding_step: stepName || currentStep,
        age_verified: true,
        guidelines_accepted: true,
        language: lang,
        profile_type: profileType || 'individual',
        paired_status: profileType === 'couple' ? 'pending' : 'single',
        partner_email: profileType === 'couple' ? partnerEmail.toLowerCase() : null,
      });
      // Save answers if any
      const answersPayload = { ...answers, questions_answered: Object.keys(answers).filter(k => answers[k]).length };
      const existingAnswers = await base44.entities.MatchingAnswers.filter({ user_id: user.id });
      if (existingAnswers.length > 0) {
        await base44.entities.MatchingAnswers.update(existingAnswers[0].id, answersPayload);
      } else if (Object.keys(answers).length > 0) {
        await base44.entities.MatchingAnswers.create({ user_id: user.id, ...answersPayload });
      }
    } catch (e) {
      console.warn('Progress save failed (non-blocking):', e.message);
    }
  };

  // ── Registration handlers ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');
    if (regPassword !== regConfirm) {
      setFormError(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }
    if (regPassword.length < 8) {
      setFormError(lang === 'fr' ? 'Le mot de passe doit comporter au moins 8 caractères.' : 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: regEmail, password: regPassword });
      setShowOtp(true);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
        setFormError(lang === 'fr' ? 'Ce courriel est déjà enregistré. Connectez-vous plutôt.' : 'This email is already registered. Please log in instead.');
      } else {
        setFormError(msg || (lang === 'fr' ? "Échec de l'inscription. Réessayez." : 'Registration failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setFormError('');
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: regEmail, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      } else {
        setFormError(lang === 'fr' ? 'Code invalide. Réessayez.' : 'Invalid code. Please try again.');
        setLoading(false);
        return;
      }
      // After verification, save profile & answers then proceed
      await handleComplete();
    } catch (err) {
      const msg = err?.message || '';
      setFormError(msg || (lang === 'fr' ? 'Code invalide. Réessayez.' : 'Invalid code. Please try again.'));
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    await base44.auth.resendOtp(regEmail);
  };

  // ── Photo upload ──
  const getFingerprint = (file) => `${file.name}_${file.size}_${file.lastModified}`;

  const handlePhotoUpload = async (index, file) => {
    if (!file) return;
    setPhotoError('');

    // Check for duplicate image (same file used in another slot)
    const fp = getFingerprint(file);
    const duplicateIndex = photoFingerprints.findIndex((f, i) => f === fp && i !== index);
    if (duplicateIndex !== -1) {
      setPhotoError(
        lang === 'fr'
          ? `Cette photo est déjà utilisée (emplacement ${duplicateIndex + 1}). Veuillez choisir une image différente.`
          : `This photo is already used (slot ${duplicateIndex + 1}). Please choose a different image.`
      );
      return;
    }

    setUploadingPhoto(index);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotos(prev => { const next = [...prev]; next[index] = file_url; return next; });
    setPhotoFingerprints(prev => { const next = [...prev]; next[index] = fp; return next; });
    setUploadingPhoto(null);
  };

  const handlePhotoRemove = (index) => {
    setPhotos(prev => { const next = [...prev]; next[index] = null; return next; });
    setPhotoFingerprints(prev => { const next = [...prev]; next[index] = null; return next; });
    setPhotoError('');
  };

  const mandatoryPhotosUploaded = photos.slice(0, 3).every(p => p !== null);

  // ── Save profile & answers, then handle plan ──
  // Called after OTP verification (user is now authenticated)
  const handleComplete = async () => {
    setLoading(true);
    setFormError('');
    try {
    const user = await base44.auth.me();

    // Calculate accurate completeness from onboarding data
    let compScore = 0;
    if (profile.first_name && profile.last_name) compScore += 5;
    if (profile.display_name) compScore += 5;
    if (profile.city) compScore += 10;
    if (profile.birthdate) compScore += 10;
    if (profile.sexual_orientation) compScore += 10;
    if (profile.gender_pronoun) compScore += 10;
    if (profile.relationship_status) compScore += 10;
    if (archetype) compScore += 10;
    const photosCount = photos.filter(Boolean).length;
    if (photosCount >= 1) compScore += 5;
    if (photosCount >= 3) compScore += 5;
    if (photosCount >= 6) compScore += 5;
    const answeredCount = Object.keys(answers).filter(k => answers[k]).length;
    compScore += Math.round((answeredCount / 21) * 15);
    const profileCompleteness = Math.min(100, compScore);

    const composedFullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ').trim();
    // Save answers first so createProfile can validate them when marking complete
    const existingAnswers = await base44.entities.MatchingAnswers.filter({ user_id: user.id });
    const answersPayload = {
      ...answers,
      questions_answered: Object.keys(answers).filter(k => answers[k]).length,
    };
    if (existingAnswers.length > 0) {
      await base44.entities.MatchingAnswers.update(existingAnswers[0].id, answersPayload);
    } else {
      await base44.entities.MatchingAnswers.create({ user_id: user.id, ...answersPayload });
    }

    await base44.functions.invoke('createProfile', {
      full_name: composedFullName,
      display_name: profile.display_name.trim() || composedFullName || user.full_name,
      city: profile.city,
      country: profile.country,
      birthdate: profile.birthdate,
      phone: phone,
      sexual_orientation: profile.sexual_orientation,
      gender_pronoun: profile.gender_pronoun,
      relationship_status: profile.relationship_status,
      dating_archetype: archetype,
      photos: photos.filter(Boolean),
      onboarding_status: 'complete',
      onboarding_complete: true,
      onboarding_step: null,
      age_verified: true,
      guidelines_accepted: true,
      language: lang,
      profile_completeness: profileCompleteness,
      profile_type: profileType || 'individual',
      paired_status: profileType === 'couple' ? 'pending' : 'single',
      partner_email: profileType === 'couple' ? partnerEmail.toLowerCase() : null,
    });

    // ── Engagement layer: ensure profile, evaluate completion, record orientation ──
    // These are best-effort — onboarding should not fail if the engagement layer errors.
    try {
      await base44.functions.invoke('ensureMemberEngagementProfile', {});
      await base44.functions.invoke('evaluateProfileCompletion', {});
      if (orientationAccepted) {
        await base44.functions.invoke('recordPolicyAcknowledgement', {
          policy_type: 'community_orientation',
          policy_version: ORIENTATION_VERSION,
          locale: lang,
        });
      }
    } catch (engErr) {
      console.warn('Engagement layer setup failed (non-blocking):', engErr.message);
    }

    // If couple, send partner link-up request or invite
    if (profileType === 'couple' && partnerEmail) {
      try {
        await base44.functions.invoke('linkPartner', {
          action: 'link',
          partner_email: partnerEmail.toLowerCase(),
          from_display_name: profile.display_name || user.full_name,
        });
        setPartnerLinkSent(true);
      } catch (e) {
        console.error('Partner link failed:', e);
      }
    }

    // For paid plans, redirect to Stripe checkout
    if (selectedPlan !== 'solar') {
      if (window.self !== window.top) {
        alert(lang === 'fr'
          ? "Le paiement fonctionne uniquement depuis l'application publiée, pas dans l'aperçu."
          : 'Payment only works from the published app, not the preview.');
        setLoading(false);
        goNext();
        return;
      }
      const origin = window.location.origin;
      const res = await base44.functions.invoke('createCheckout', {
        price_key: getPriceKey(selectedPlan, selectedDuration),
        success_url: `${origin}/home?payment=success`,
        cancel_url: `${origin}/onboarding`,
        user_id: user.id,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }
    }

    setLoading(false);
    goNext(); // → complete
    } catch (err) {
      console.error('Onboarding completion failed:', err);
      setFormError(lang === 'fr'
        ? `Erreur lors de la sauvegarde de votre profil: ${err.message}`
        : `Error saving your profile: ${err.message}`);
      setLoading(false);
    }
  };

  const archetypes = [
    { id: 'blue', color: '#60A5FA', name: t('onboarding.blue_name'), desc: t('onboarding.blue_desc') },
    { id: 'black', color: '#9CA3AF', name: t('onboarding.black_name'), desc: t('onboarding.black_desc') },
    { id: 'purple', color: '#A855F7', name: t('onboarding.purple_name'), desc: t('onboarding.purple_desc') },
  ];

  const plans = ALL_PLANS.map(plan => ({
    id: plan.key,
    name: lang === 'fr' ? plan.label_fr : plan.label_en,
    color: plan.color,
    desc: lang === 'fr' ? plan.desc_fr : plan.desc_en,
    startingPrice: lang === 'fr' ? plan.price_fr : plan.price_en,
    durations: plan.durations.map(d => ({
      key: d.key.replace(`${plan.key}_`, ''),
      label: lang === 'fr' ? d.label_fr : d.label_en,
      price: d.price,
    })),
  }));

  const getPriceKey = (planId, duration) => {
    if (planId === 'solar') return null;
    return `${planId}_${duration}`;
  };

  const getSelectedPrice = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan || !plan.durations.length) return null;
    return plan.durations.find(d => d.key === selectedDuration) || plan.durations[0];
  };

  const pageVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  if (guardState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0B0510] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (guardState === 'error') {
    return (
      <div className="min-h-screen bg-[#0B0510] flex flex-col items-center justify-center gap-4 px-6">
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-[#F0E6FF]/60 text-sm text-center max-w-xs">
          {lang === 'fr' ? 'Une erreur est survenue lors du chargement de votre parcours.' : 'Something went wrong while loading your journey.'}
        </p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 glass-card rounded-full text-[#F0E6FF] flex items-center gap-2 hover:border-[rgba(245,168,0,0.3)] transition-all">
          <RefreshCw className="w-4 h-4" />
          {lang === 'fr' ? 'Réessayer' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0510] flex flex-col">
      {/* Top toggles — always visible */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      {/* Progress bar */}
      {step > 0 && step < STEPS.length - 1 && (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-[rgba(240,230,255,0.05)]">
          <motion.div className="h-full bg-[#F5A800]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ── AGE ── */}
          {currentStep === 'age' && (
            <motion.div key="age" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-8">
              <NinaSpeech message={t('onboarding.age_question')} />
              <p className="text-foreground/50 text-sm text-center">{t('onboarding.age_required')}</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={goNext}
                  className="py-4 glass-card-gold rounded-2xl text-[#F5A800] font-bold text-lg hover:bg-[rgba(245,168,0,0.08)] transition-all">
                  {t('onboarding.yes')}
                </button>
                <button onClick={() => { base44.auth.logout(); navigate('/'); }}
                  className="py-4 glass-card rounded-2xl text-foreground/50 font-medium text-lg hover:bg-[rgba(240,230,255,0.04)] transition-all">
                  {t('onboarding.no')}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── GUIDELINES ── */}
          {currentStep === 'guidelines' && (
            <motion.div key="guidelines" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <NinaSpeech message={t('onboarding.guidelines_intro')} />
              <h2 className="font-serif text-2xl text-foreground">{t('onboarding.guidelines_title')}</h2>
              {[t('onboarding.honest'), t('onboarding.respectful'), t('onboarding.conscious')].map((g, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 flex items-start gap-3 border-[rgba(245,168,0,0.15)]">
                  <div className="w-6 h-6 rounded-full bg-[rgba(245,168,0,0.15)] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5 text-[#F5A800]" />
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed">{g}</p>
                </div>
              ))}
              {/* Art. 9 (GDPR) explicit consent for sensitive data */}
              <label className="glass-card rounded-2xl p-4 flex items-start gap-3 cursor-pointer border-[rgba(123,47,190,0.2)]">
                <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#F5A800] shrink-0" />
                <span className="text-foreground/70 text-xs leading-relaxed">
                  {lang === 'fr'
                    ? <>Je consens expressément (art. 9 RGPD / Loi 25 Québec) à ce que Nina Purple traite mes données sensibles — orientation sexuelle et préférences relationnelles — exclusivement aux fins de compatibilité. Je peux retirer ce consentement à tout moment en supprimant mon compte. Voir la <a href="/privacy" className="text-[#F5A800] underline">politique de confidentialité</a>.</>
                    : <>I expressly consent (GDPR Art. 9 / Quebec Law 25) to Nina Purple processing my sensitive data — sexual orientation and relationship preferences — solely for compatibility matching. I may withdraw this consent at any time by deleting my account. See the <a href="/privacy" className="text-[#F5A800] underline">Privacy Policy</a>.</>}
                </span>
              </label>
              {!consentAccepted && (
                <p className="text-[#F5A800]/60 text-xs text-center">
                  {lang === 'fr' ? 'Cochez la case ci-dessus pour continuer' : 'Check the box above to continue'}
                </p>
              )}
              <button onClick={goNext} disabled={!consentAccepted}
                className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {t('onboarding.accept_guidelines')}
              </button>
            </motion.div>
          )}

          {/* ── SEGMENTATION ── */}
          {currentStep === 'segmentation' && (
            <motion.div key="segmentation" className="w-full">
              <CoupleSegmentation
                profileType={profileType}
                setProfileType={setProfileType}
                partnerEmail={partnerEmail}
                setPartnerEmail={setPartnerEmail}
                onContinue={goNext}
                isFr={lang === 'fr'}
              />
            </motion.div>
          )}

          {/* ── PROFILE ── */}
          {currentStep === 'profile' && (
            <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <h2 className="font-serif text-3xl text-foreground">{t('onboarding.profile_title')}</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground/60 text-sm mb-2">{lang === 'fr' ? 'Prénom' : 'First name'} <span className="text-[#F5A800]">*</span></label>
                  <input type="text" value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                    className="w-full glass-card rounded-xl px-4 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent"
                    placeholder={lang === 'fr' ? 'Prénom' : 'First name'} />
                </div>
                <div>
                  <label className="block text-foreground/60 text-sm mb-2">{lang === 'fr' ? 'Deuxième prénom' : 'Middle name'} <span className="text-foreground/30 text-xs font-normal">{lang === 'fr' ? '(optionnel)' : '(optional)'}</span></label>
                  <input type="text" value={profile.middle_name} onChange={e => setProfile(p => ({ ...p, middle_name: e.target.value }))}
                    className="w-full glass-card rounded-xl px-4 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent"
                    placeholder={lang === 'fr' ? 'Deuxième prénom' : 'Middle name'} />
                </div>
              </div>
              <div>
                <label className="block text-foreground/60 text-sm mb-2">{lang === 'fr' ? 'Nom' : 'Last name'} <span className="text-[#F5A800]">*</span></label>
                <input type="text" value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                  className="w-full glass-card rounded-xl px-4 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent"
                  placeholder={lang === 'fr' ? 'Nom' : 'Last name'} />
              </div>
              <div>
                <label className="block text-foreground/60 text-sm mb-2">{t('onboarding.display_name_label')} <span className="text-[#F5A800]">*</span></label>
                <input type="text" value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                  className="w-full glass-card rounded-xl px-4 py-3 text-foreground outline-none focus:border-[rgba(245,168,0,0.4)] transition-all bg-transparent"
                  placeholder={t('onboarding.name_label')} />
                <p className="text-foreground/30 text-xs mt-1">{t('onboarding.display_name_hint')}</p>
              </div>

              <div>
                <label className="block text-foreground/60 text-sm mb-2">
                  {t('onboarding.location_label')} <span className="text-[#F5A800]">*</span>
                </label>
                <LocationAutocomplete
                  value={profile.city}
                  onChange={val => setProfile(p => ({ ...p, city: val }))}
                  onValidityChange={(isValid, data) => {
                    setLocationValid(isValid);
                    if (data?.country) setProfile(p => ({ ...p, country: data.country }));
                  }}
                  placeholder={lang === 'fr' ? 'Entrez votre ville (ex: Montréal…)' : 'Enter your city (e.g., Montreal…)'} />
                {profile.city && profile.city.length >= 2 && !locationValid && (
                  <p className="text-foreground/40 text-xs mt-1">
                    {lang === 'fr' ? 'Sélectionnez votre ville dans la liste déroulante.' : 'Select your city from the dropdown list.'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-foreground/60 text-sm mb-2">{t('onboarding.birthdate_label')} <span className="text-[#F5A800]">*</span></label>
                <input type="date" value={profile.birthdate}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  onChange={e => {
                    const val = e.target.value;
                    setProfile(p => ({ ...p, birthdate: val }));
                    setAgeError(val && !isOver18(val) ? (lang === 'fr' ? 'Vous devez avoir 18 ans ou plus.' : 'You must be 18 years or older.') : '');
                  }}
                  className={`w-full glass-card rounded-xl px-4 py-3 text-foreground outline-none transition-all bg-transparent ${ageError ? 'border-red-500/60' : 'focus:border-[rgba(245,168,0,0.4)]'}`} />
                {ageError && <p className="text-red-400 text-xs mt-1">{ageError}</p>}
              </div>

              <div>
                <label className="block text-foreground/60 text-sm mb-2">
                  {lang === 'fr' ? 'Numéro de téléphone (avec indicatif pays)' : 'Phone Number (with country code)'} <span className="text-[#F5A800]">*</span>
                </label>
                <PhoneInput value={phone} onChange={setPhone} onValidityChange={setPhoneValid} lang={lang} />
              </div>

              {[
                { label: t('onboarding.orientation_label'), key: 'sexual_orientation', options: lang === 'fr' ? ['Hétérosexuel(le)', 'Gay', 'Lesbienne', 'Bisexuel(le)', 'Asexuel(le)', 'Pansexuel(le)', 'Queer', 'Autre'] : ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Pansexual', 'Queer', 'Other'] },
                { label: t('onboarding.pronoun_label'), key: 'gender_pronoun', options: ['He/Him', 'She/Her', 'They/Them', 'Non-Binary', lang === 'fr' ? 'Autre' : 'Other'] },
                { label: t('onboarding.status_label'), key: 'relationship_status', options: lang === 'fr' ? ['Célibataire', 'Séparé(e)', 'Veuf/Veuve', 'Divorcé(e)', 'Relation ouverte', 'Autre'] : ['Single', 'Separated', 'Widowed', 'Divorced', 'Open Relationship', 'Other'] },
              ].map(sel => (
                <div key={sel.key}>
                  <label className="block text-foreground/60 text-sm mb-2">{sel.label} <span className="text-[#F5A800]">*</span></label>
                  <select value={profile[sel.key]} onChange={e => setProfile(p => ({ ...p, [sel.key]: e.target.value }))}
                    className="w-full glass-card rounded-xl px-4 py-3 text-foreground outline-none bg-card border border-border">
                    <option value="">—</option>
                    {sel.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}

              {(() => {
                const missing = [];
                if (!profile.first_name.trim()) missing.push(lang === 'fr' ? 'prénom' : 'first name');
                if (!profile.last_name.trim()) missing.push(lang === 'fr' ? 'nom' : 'last name');
                if (!profile.display_name.trim()) missing.push(lang === 'fr' ? 'nom affiché' : 'display name');
                if (!profile.city.trim() || !locationValid) missing.push(lang === 'fr' ? 'ville (sélectionnée dans la liste)' : 'city (selected from dropdown)');
                if (!profile.birthdate || !isOver18(profile.birthdate)) missing.push(lang === 'fr' ? 'date de naissance (18+)' : 'birthdate (18+)');
                if (!profile.sexual_orientation) missing.push(lang === 'fr' ? 'orientation' : 'orientation');
                if (!profile.gender_pronoun) missing.push(lang === 'fr' ? 'pronom' : 'pronoun');
                if (!profile.relationship_status) missing.push(lang === 'fr' ? 'statut' : 'status');
                if (!phoneValid) missing.push(lang === 'fr' ? 'téléphone valide' : 'valid phone');
                const ok = missing.length === 0;
                return (
                  <>
                    {!ok && (
                      <div className="px-4 py-3 rounded-xl bg-[rgba(245,168,0,0.08)] border border-[rgba(245,168,0,0.2)] text-[#F5A800]/80 text-xs leading-relaxed">
                        <span className="font-semibold">{lang === 'fr' ? 'À compléter pour continuer : ' : 'Still needed to continue: '}</span>
                        {missing.join(', ')}
                      </div>
                    )}
                    <button onClick={() => ok && goNext()} disabled={!ok}
                      className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      {t('onboarding.continue')}
                    </button>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ── ARCHETYPE ── */}
          {currentStep === 'archetype' && (
            <motion.div key="archetype" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <NinaSpeech message={t('onboarding.archetype_intro')} />
              <h2 className="font-serif text-3xl text-[#F0E6FF]">{t('onboarding.archetype_title')}</h2>
              {archetypes.map(a => {
                const isSelected = archetype === a.id;
                return (
                  <button key={a.id} onClick={() => setArchetype(a.id)}
                    className="w-full rounded-2xl p-5 text-left transition-all duration-300 relative overflow-hidden"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${a.color}22 0%, ${a.color}0a 100%)`
                        : isLight ? 'rgba(255,255,255,0.88)' : 'rgba(31,16,38,0.7)',
                      border: `2px solid ${isSelected ? a.color : isLight ? 'rgba(123,47,190,0.15)' : 'rgba(240,230,255,0.08)'}`,
                      boxShadow: isSelected ? `0 0 28px ${a.color}40, inset 0 0 20px ${a.color}08` : 'none',
                      backdropFilter: 'blur(40px)',
                    }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-serif text-xl" style={{ color: a.color }}>{a.name}</div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: a.color }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#0B0510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed transition-colors" style={{ color: isSelected ? (isLight ? 'rgba(26,10,46,0.85)' : 'rgba(240,230,255,0.85)') : (isLight ? 'rgba(26,10,46,0.55)' : 'rgba(240,230,255,0.5)') }}>{a.desc}</div>
                  </button>
                );
              })}
              {!archetype && (
                <p className="text-[#F5A800]/60 text-xs text-center">
                  {lang === 'fr' ? 'Sélectionnez un archétype pour continuer' : 'Select an archetype to continue'}
                </p>
              )}
              <button onClick={goNext} disabled={!archetype}
                className={`w-full py-4 rounded-full font-bold uppercase tracking-widest transition-all ${archetype ? 'bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400' : 'bg-muted text-muted-foreground/30 cursor-not-allowed'}`}>
                {t('onboarding.continue')}
              </button>
            </motion.div>
          )}

          {/* ── PHOTOS ── */}
          {currentStep === 'photos' && (
            <motion.div key="photos" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <h2 className="font-serif text-3xl text-foreground">{t('onboarding.photos_title')}</h2>
              <NinaSpeech message={t('onboarding.photos_desc')} />
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="relative aspect-square">
                    <label className={`w-full h-full glass-card rounded-2xl flex items-center justify-center cursor-pointer hover:border-[rgba(245,168,0,0.3)] transition-all relative overflow-hidden block ${i < 3 ? 'border-[rgba(245,168,0,0.15)]' : ''}`}>
                      <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) handlePhotoUpload(i, e.target.files[0]); e.target.value = ''; }} />
                      {photos[i] ? (
                        <img src={photos[i]} alt="" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                      ) : uploadingPhoto === i ? (
                        <div className="w-5 h-5 border-2 border-[#F5A800] border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : (
                        <div className="text-center">
                          <Upload className={`w-6 h-6 mx-auto mb-1 ${i < 3 ? 'text-[#F5A800]' : 'text-[rgba(240,230,255,0.2)]'}`} />
                          {i < 3 && <div className="text-[8px] text-[#F5A800]/60">{t('onboarding.required_badge')}</div>}
                        </div>
                      )}
                    </label>
                    {/* Remove button */}
                    {photos[i] && (
                      <button
                        onClick={() => handlePhotoRemove(i)}
                        className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-[rgba(11,5,16,0.8)] border border-[rgba(240,230,255,0.2)] flex items-center justify-center hover:bg-red-500/80 transition-all"
                      >
                        <X className="w-3 h-3 text-[#F0E6FF]" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {photoError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {photoError}
                </div>
              )}
              <p className="text-foreground/40 text-sm text-center">{t('onboarding.photos_required')}</p>
              {!mandatoryPhotosUploaded && (
                <div className="px-4 py-3 rounded-xl bg-[rgba(245,168,0,0.08)] border border-[rgba(245,168,0,0.2)] text-[#F5A800]/80 text-xs leading-relaxed text-center">
                  {lang === 'fr'
                    ? `Téléversez au moins 3 photos (${photos.filter(Boolean).length}/3)`
                    : `Upload at least 3 photos (${photos.filter(Boolean).length}/3)`}
                </div>
              )}
              <button onClick={goNext} disabled={!mandatoryPhotosUploaded}
                className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {t('onboarding.continue')}
              </button>
            </motion.div>
          )}

          {/* ── QUESTIONS ── */}
          {currentStep === 'questions' && (
            <motion.div key={`q-${currentQ}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5 }}
              className="w-full space-y-6">
              {currentQ === 0 && profileType === 'couple' && (
                <div className="p-3 rounded-xl bg-[rgba(123,47,190,0.08)] border border-[rgba(123,47,190,0.2)] mb-2">
                  <div className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-[#7B2FBE] shrink-0 mt-0.5" />
                    <p className="text-foreground/60 text-xs leading-relaxed">
                      {lang === 'fr'
                        ? "Pour les couples, ces questions ne servent pas au matching — chaque partenaire répond individuellement, puis vous pourrez comparer vos réponses côte à côte dans votre tableau de bord."
                        : "For couples, these questions are not for matching — each partner answers individually, then you can compare your answers side-by-side in your dashboard."}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-foreground/40 text-sm shrink-0">{currentQ + 1} / {QUESTIONS_21.length}</span>
                <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-[#F5A800] rounded-full transition-all duration-300"
                    style={{ width: `${((currentQ + 1) / QUESTIONS_21.length) * 100}%` }} />
                </div>
              </div>
              <h2 className="font-serif text-2xl text-foreground leading-relaxed">
                {lang === 'fr' ? QUESTIONS_21[currentQ].fr : QUESTIONS_21[currentQ].en}
              </h2>
              <div className="space-y-2">
                {(lang === 'fr' ? QUESTIONS_21[currentQ].options_fr : QUESTIONS_21[currentQ].options_en).map((label, i) => {
                  const qKey = QUESTIONS_21[currentQ].key;
                  const optKey = QUESTIONS_21[currentQ].opt_keys[i];
                  const selected = answers[qKey] === optKey;
                  return (
                    <button key={i} onClick={() => {
                      handleAnswer(qKey, optKey);
                      if (currentQ < QUESTIONS_21.length - 1) setTimeout(() => setCurrentQ(q => q + 1), 350);
                    }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm ${selected ? 'bg-[rgba(245,168,0,0.12)] border border-[rgba(245,168,0,0.4)] text-[#F5A800]' : 'glass-card hover:border-[rgba(245,168,0,0.2)] text-foreground/80'}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                {currentQ > 0 && (
                  <button onClick={() => setCurrentQ(q => q - 1)}
                    className="px-6 py-3 glass-card rounded-full text-foreground/60 hover:opacity-80 transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {currentQ === QUESTIONS_21.length - 1 && (
                  <>
                    {!answers[QUESTIONS_21[currentQ].key] && (
                      <p className="text-[#F5A800]/60 text-xs flex-1 text-center self-center">
                        {lang === 'fr' ? 'Sélectionnez une réponse pour continuer' : 'Select an answer to continue'}
                      </p>
                    )}
                    <button onClick={goNext} disabled={!answers[QUESTIONS_21[currentQ].key]}
                      className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      {t('onboarding.continue')}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ORIENTATION ── */}
          {currentStep === 'orientation' && (
            <motion.div key="orientation" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-6">
              <NinaSpeech message={lang === 'fr' ? 'Bienvenue dans la communauté Nina Purple. Prenons un moment pour partager nos valeurs.' : 'Welcome to the Nina Purple community. Let\'s take a moment to share our values.'} />
              <h2 className="font-serif text-2xl text-foreground">
                {lang === 'fr' ? 'Orientation Communautaire' : 'Community Orientation'}
              </h2>
              <div className="space-y-3">
                {[
                  { fr: 'Nina Purple favorise les connexions intentionnelles et respectueuses.', en: 'Nina Purple supports intentional, respectful connection.' },
                  { fr: 'Les membres décident s\'ils se rencontrent en personne, et quand.', en: 'Members decide if and when they meet offline.' },
                  { fr: 'Ne partagez pas de conversations privées, captures d\'écran, adresses ou informations sensibles sans consentement.', en: 'Do not share private conversations, screenshots, addresses, or sensitive information without consent.' },
                  { fr: 'Privilégiez les lieux publics et informez un contact de confiance lors d\'une première rencontre.', en: 'Consider public venues and trusted-contact planning when meeting someone new.' },
                  { fr: 'Utilisez les outils de blocage et de signalement si quelque chose ne va pas.', en: 'Use current block/report tools if something feels wrong.' },
                  { fr: 'La position communautaire reflète la participation; ce n\'est pas une vérification d\'identité, une garantie de sécurité ou une approbation.', en: 'Community Standing reflects participation; it is not legal identity verification, a safety guarantee, or endorsement of a member.' },
                ].map((item, i) => (
                  <div key={i} className="glass-card rounded-2xl p-4 flex items-start gap-3 border-[rgba(245,168,0,0.15)]">
                    <div className="w-6 h-6 rounded-full bg-[rgba(245,168,0,0.15)] flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#F5A800]" />
                    </div>
                    <p className="text-foreground/80 text-sm leading-relaxed">
                      {lang === 'fr' ? item.fr : item.en}
                    </p>
                  </div>
                ))}
              </div>
              <label className="glass-card rounded-2xl p-4 flex items-start gap-3 cursor-pointer border-[rgba(123,47,190,0.2)]">
                <input type="checkbox" checked={orientationAccepted} onChange={e => setOrientationAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#F5A800] shrink-0" />
                <span className="text-foreground/70 text-xs leading-relaxed">
                  {lang === 'fr'
                    ? "J'ai lu et je comprends l'orientation communautaire de Nina Purple. Je comprends que la position communautaire n'est pas une vérification d'identité ni une garantie de sécurité."
                    : "I have read and understand the Nina Purple community orientation. I understand that Community Standing is not identity verification or a safety guarantee."}
                </span>
              </label>
              {!orientationAccepted && (
                <p className="text-[#F5A800]/60 text-xs text-center">
                  {lang === 'fr' ? 'Cochez la case ci-dessus pour continuer' : 'Check the box above to continue'}
                </p>
              )}
              <button onClick={goNext} disabled={!orientationAccepted}
                className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {t('onboarding.accept_guidelines')}
              </button>
            </motion.div>
          )}

          {/* ── SUBSCRIPTION ── */}
          {currentStep === 'subscription' && (
            <motion.div key="subscription" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.6 }}
              className="w-full space-y-3">
              {formError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {formError}
                </div>
              )}
              <NinaSpeech message={t('onboarding.subscription_intro')} />
              <h2 className="font-serif text-3xl text-foreground">{t('onboarding.subscription_title')}</h2>
              <p className="text-foreground/50 text-sm">{lang === 'fr' ? 'Vous pouvez changer de plan à tout moment.' : 'You can change your plan anytime.'}</p>

              {plans.map(plan => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div key={plan.id}
                    className="rounded-2xl overflow-hidden transition-all duration-300"
                    style={{
                      border: `1.5px solid ${isSelected ? plan.color : isLight ? 'rgba(123,47,190,0.12)' : 'rgba(240,230,255,0.1)'}`,
                      boxShadow: isSelected ? `0 0 24px ${plan.color}25` : 'none',
                      background: isSelected && !isLight ? `linear-gradient(135deg, rgba(${plan.id === 'solar' ? '167,139,250' : plan.id === 'lunar' ? '123,47,190' : plan.id === 'stellar' ? '168,85,247' : '245,168,0'},0.1) 0%, rgba(31,16,38,0.95) 100%)` : isSelected && isLight ? `linear-gradient(135deg, rgba(${plan.id === 'solar' ? '167,139,250' : plan.id === 'lunar' ? '123,47,190' : plan.id === 'stellar' ? '168,85,247' : '245,168,0'},0.08) 0%, rgba(255,255,255,0.92) 100%)` : isLight ? 'rgba(255,255,255,0.85)' : 'rgba(31,16,38,0.7)',
                    }}>

                    {/* Plan header row */}
                    <button
                      onClick={() => { setSelectedPlan(plan.id); if (plan.durations.length) setSelectedDuration(plan.durations[0].key); }}
                      className="w-full p-4 text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {/* Radio indicator */}
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                          style={{ borderColor: plan.color, background: isSelected ? plan.color : 'transparent' }}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#0B0510]" />}
                        </div>
                        <div>
                          <div className="font-serif text-lg font-semibold" style={{ color: plan.color }}>{plan.name}</div>
                          <div className="text-foreground/50 text-xs mt-0.5">{plan.desc}</div>
                        </div>
                      </div>
                      {/* Price indicator — always visible */}
                      <div className="text-right shrink-0 ml-3">
                        {isSelected && plan.durations.length > 0 && getSelectedPrice()
                          ? <div className="text-xl font-bold text-foreground">{getSelectedPrice().price}</div>
                          : <div className="text-base font-semibold" style={{ color: plan.color }}>{plan.startingPrice}</div>
                        }
                      </div>
                    </button>

                    {/* Duration selector — always visible for paid plans, expanded when selected */}
                    {plan.durations.length > 0 && (
                      <div className={`px-4 pb-4 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="flex flex-wrap gap-2">
                          {plan.durations.map(dur => {
                            const isDurSelected = isSelected && selectedDuration === dur.key;
                            return (
                              <button key={dur.key}
                                onClick={() => { setSelectedPlan(plan.id); setSelectedDuration(dur.key); }}
                                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                                style={{
                                  background: isDurSelected ? plan.color : isLight ? 'rgba(123,47,190,0.07)' : 'rgba(240,230,255,0.06)',
                                  color: isDurSelected ? '#0B0510' : isLight ? 'rgba(26,10,46,0.65)' : 'rgba(240,230,255,0.65)',
                                  border: `1px solid ${isDurSelected ? plan.color : isLight ? 'rgba(123,47,190,0.18)' : 'rgba(240,230,255,0.12)'}`,
                                }}>
                                {dur.label} · {dur.price}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button onClick={() => handleComplete()} disabled={loading}
                className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all mt-2 shadow-[0_0_30px_rgba(245,168,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'fr' ? 'Sauvegarde...' : 'Saving...'}</> : t('onboarding.continue')}
              </button>
            </motion.div>
          )}

          {/* ── COMPLETE ── */}
          {currentStep === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
              className="w-full space-y-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-[rgba(245,168,0,0.08)] animate-ping" style={{ animationDuration: '2s' }} />
                </div>
                {profileType === 'couple' ? (
                  <div className="w-40 h-40 mx-auto relative z-10 rounded-full bg-[rgba(123,47,190,0.15)] flex items-center justify-center drop-shadow-[0_0_40px_rgba(123,47,190,0.4)]">
                    <Heart className="w-20 h-20 text-[#7B2FBE]" />
                  </div>
                ) : (
                  <img src={ninaCharacter}
                    alt="Nina" className="w-40 mx-auto relative z-10 drop-shadow-[0_0_40px_rgba(245,168,0,0.5)]" />
                )}
              </div>
              <div>
                <h1 className="font-serif text-4xl text-foreground mb-3">{t('onboarding.complete')}</h1>
                {profileType === 'couple' ? (
                  <div className="space-y-3">
                    <p className="text-foreground/60 leading-relaxed">
                      {lang === 'fr'
                        ? partnerLinkSent
                          ? "Votre profil de couple a été créé. Une demande de liaison a été envoyée à votre partenaire. Une fois qu'il aura accepté, vous pourrez comparer vos réponses côte à côte dans votre tableau de bord."
                          : "Votre profil de couple a été créé. Vous pourrez comparer vos réponses avec votre partenaire dans votre tableau de bord."
                        : partnerLinkSent
                          ? "Your couple profile has been created. A link-up request has been sent to your partner. Once they accept, you can compare your answers side-by-side in your dashboard."
                          : "Your couple profile has been created. You can compare your answers with your partner in your dashboard."}
                    </p>
                    <div className="p-3 rounded-xl bg-[rgba(123,47,190,0.08)] border border-[rgba(123,47,190,0.2)]">
                      <p className="text-foreground/50 text-xs leading-relaxed">
                        {lang === 'fr'
                          ? "Votre profil de couple est réservé à l'expérience Nina Purple. Il ne fait PAS partie du pool de matching/dating. Vous ne recevrez pas de correspondances individuelles."
                          : "Your couple profile is for the Nina Purple Experience only. It is NOT part of the dating/matching pool. You will not receive individual matches."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground/60 leading-relaxed">{t('onboarding.complete_desc')}</p>
                )}
              </div>
              <button onClick={() => { window.location.href = '/compatibility-profile'; }}
                className="w-full py-5 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_40px_rgba(245,168,0,0.4)] text-lg">
                {t('onboarding.go_home')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back button — not on first step or complete */}
        {step > 0 && currentStep !== 'complete' && !showOtp && (
          <button onClick={goPrev} className="mt-6 flex items-center gap-1 text-foreground/30 text-sm hover:text-foreground/60 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {t('common.back')}
          </button>
        )}

        {/* Back from OTP to email form */}
        {showOtp && (
          <button onClick={() => { setShowOtp(false); setFormError(''); setOtpCode(''); }}
            className="mt-6 flex items-center gap-1 text-foreground/30 text-sm hover:text-foreground/60 transition-colors">
            <ChevronLeft className="w-4 h-4" /> {lang === 'fr' ? 'Retour au formulaire' : 'Back to registration form'}
          </button>
        )}

        {/* Cancel — always visible on every step except complete */}
        {currentStep !== 'complete' && (
          <a
            href="https://www.NinaPurple.Love"
            className="mt-3 block text-center text-foreground/20 text-xs hover:text-foreground/40 transition-colors"
          >
            {lang === 'fr' ? '✕ Annuler et revenir à NinaPurple.Love' : '✕ Cancel and return to NinaPurple.Love'}
          </a>
        )}
      </div>
    </div>
  );
}