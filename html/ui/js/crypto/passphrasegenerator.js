/**
 * @depends {../3rdparty/jquery-2.1.0.js}
 */

var PassPhraseGenerator = {
	seeds: 0,
	seedLimit: 512,

	push: function(seed) {
		Math.seedrandom(seed, true);
		this.seeds++;
	},

	isDone: function() {
		if (this.seeds == this.seedLimit) {
			return true;
		}
		return false;
	},

	percentage: function() {
		return Math.round((this.seeds / this.seedLimit) * 100)
	},

	passPhrase: "",

	wordCount: 1999,

	words: ["kézipoggyász","redőnyös","dolgon","tőröz","hírverés","feltevése","csíptet","vasszűz","leszól","sietős","kondiktancia","pedagógus","gyűrűskála","perjel","sírkő","csökönyösség","kicsapongásra","részhang","elfelejt","kipbőr","golfpálya","kenyerét","kiélvez","pandit","életközösségben","hajrázik","sikkasztás","mögöttem","tengernyi","kioktat","lelohadás","harmonikaszerűen","ék","mesterség","zúzza","átutal","maszlag","szederfa","kézihajtás","gond","fényjelzés","rögeszme","itatóhoz","világítva","zörejmentesítés","sorsában","misekönyv","doki","klorofilszerű","visszametsz","megmaradó","arkangyal","linea","gépselyem","mereszti","harangoz","sátánista","elhidegülés","egyenetlenül","nagyobbra","útiránytól","arretáló","rézszerelvények","héjas","zárat","tapad","tűzben","elferdít","rund","tudom","lehív","vezetéket","felsorolatlan","előrehalad","eltakarja","elapadtak","axióma","farkvég","gépelés","visszahonosítás","odaérünk","kandidátus","tornacsarnok","cinkit","hüvelykujjpárna","szaporodik","lerövidített","zenei","gumiszalag","kupica","kvintszext","árakkal","útján","szabász","önindító","kinéz","előre-hátra","nagyvonalúság","fonnyad","fanosodás","nyerek","faborítás","létra","követési","együttesen","tartozásomat","konyhája","kín","díszítőcérna","megdöbbentően","menjo","benyomódás","nyélbeillesztés","irtószer","szétszakít","farkhoz","lóvásártér","portörlés","írásban","timsóoldat","biztosítva","krétarajz","ereklye","primitív","megfordítás","vértestecskék","offertórium","gyapjúhozama","befedez","feltisztul","idézőjelek","törölközik","reagálásra","szinterel","szavalat","uralkodóban","békebíró","szemem","zenés","nyomólemez","közlékenység","sportszerető","legyengülés","úsztatja","robotol","fejősök","vészvillogó","dokumentációs","kezelő","triplett","útról","folyat","ácsolatkötés","frissességét","sercegő","visszatartani","gyakorta","ajánlanod","sóér","vékonyuló","fitymálás","nyilvános","törvénye","vánkos","lemészárlás","sárgarigó","stagnáló","érzékszerv","felfúj","beszállási","eltűnik","méhsejthűtő","hadnagy","iszapol","elátkozás","kézzel-lábbal","legkülső","iszákosság","hozzájuttat","rejlő","választ","nyüszítés","csoroszlya","masszívság","pillanatában","orrába","refrént","elballag","visszaverődő","űrhajók","légnyílás","hidrogénez","házkutatási","képessé","alcím","könnyezve","elrendezése","fékez","délebéd","ország-világjáró","kompromittálja","hűsít","felpáncéloz","poggyászjegy","sikálás","bibliája","hús","kisétkű","mutatvány","hasonlat","törvénykezés","táblázatos","elméletét","helyzetértékelés","import","diplomáciai","mintáz","ráeső","csatárok","abroncs","lécező","fintorgatja","harmonikás","fuvarforduló","utcakő","smirglipapír","traumatológia","mimóza","defekt","peng","vázolás","híddaru","szétdobál","képcsöves","kislelkűen","felbukik","hörghurut","élelem","bolondéria","égőfej","kiürít","deportálás","kiengesztel","visszaborzadás","fényjelző","csoportokba","unható","nagyevő","vörheny","nosztalgiázó","elcsigáz","áruforgalom","értekezlettel","jogsérelem","elevenére","alázatosság","érkeztem","sablonos","vezetékló","tetszésnyilvánítás","kirohanás","szarkasztikus","zűrzavart","ivópalack","sárvédő","vámpír","odafentről","szimata","beláthatatlan","elcsodálkozva","mérlegállás","szerelme","meghámoz","kifogások","összerázás","flexibilis","fizetség","vörössé","törtszám","megvilágosodott","kényeskedés","forgácsolható","számításait","melegít","ömlengős","túlélhető","letisztázó","rakétahajtómű","esővízgyűjtő","tikkadtság","vadnyugati","zománcmunka","egybehívás","férek","hotel","frakkot","közép","vörösöntvény","előreugrik","rand","lökhárító","prérifarkas","túlsúly","uzsoraár","felravataloz","cicomás","húzgál","szőrös","hullórostély","homorít","szépségtapaszt","adminisztrátor","kapa","vagyonkezelés","testetlen","többféle","elindítás","szerszámokkal","felfüstölés","megszégyenülve","megolvasás","pácol","süllyesztés","esztergályozás","gördít","tőke","parciális","üszkös","senkit","sír","előbb-utóbb","szétrostálás","bohóskodás","tartású","gátolt","bicepsz","autógumi","állásáról","megkötöttségek","elégít","mérőrúd","vágódeszka","légáramlás","kifulladó","fejelőtégla","ívszélesítő","feltalálás","kötekedés","kétséges","jámbor","sértődő","indítás","ájul","tények","partraszállási","vademse","vaseszterga","szárazbab","bemesél","szellemeskedés","tereppont","nincsen","sajtóközlemény","meghizlal","fioritúra","szegélyű","légköri","elapróz","utcaseprő","egy-kettő","tévhit","lenyírt","visszafajzás","festésű","népszerűsítés","oxidál","dévajkodik","sonkával","zsibbasztó","szakmája","katonazene","felépítő","kiváltógerenda","szignó","meszesgödör","süketség","szerencsésebb","testnevelés","vezetően","okosan","nyelvújító","tanulmányozó","luxus","uraként","névsort","franc","lágyforrasz","takarmányt","angolnavarsa","világfájdalom","csutakolás","rögzítőgyűrű","dereglye","írástudói","nemesfémé","mellékzörejek","nagybani","országok","élvhajhász","kézimunkázik","piackutatás","tágra","badarság","liftes","érintkezés","vízfodrozódás","hangsúlyozás","fátylat","kielégíthetetlen","menetfúrás","adottságok","folyamata","utóhad","szódabikarbónás","nehézvíz","váltók","egynek","felszökik","alakulás","időszakhoz","nagykövet","kötelességszegés","gőgicsélés","nehezebbé","másodpéldány","lövegtalp","megéget","szívességből","bosszankodva","szólóénekes","akkordban","képzett","képletesen","ösztönök","tanult","tarhál","rejtekéből","makaróni","eredetű","kosztol","hadtápterület","versláb","adományokat","lovaglóösvény","biliárdgolyó","szikracsillapító","ellesi","toszik","finoman","kikiáltási","különböző","egyházfegyelmi","feljebbvaló","láthatatlanság","ereklyetartó","ejtőcső","palás","millennista","törleszthető","kisajátítási","forintot","megillető","ütközőfej","dereglyés","szitaszövet","össze-vissza","feldicsér","gerinctövi","lakozik","lecsapható","kijövetel","élete","cementhabarcs","birtoklevél","esőcseppek","őrparancsnok","izzadó","eszpresszó","ütődött","soványodás","bájosan","konfirmált","tapétázás","harsog","öregségi","bridzseztünk","ködfoltos","közönyösen","foglalni","klórozott","tusszakselyem","elfüggönyöz","marókáli","bőring","egyenleg","vasaló","korog","millennium","kerestet","offset-gumikendő","mihaszna","emberbarátiság","ütőerő","áthatolhatatlan","akárkinek","folytat","sétahangverseny","repülőjárat","pénztárpult","megrémít","vízbevetése","járkálás","fárasztógép","kocsány","földmozgatás","bebocsát","altemplom","pázsitos","plagizátor","penzióba","nyíróolló","masszázs","közömbösség","ingerlés","hiányt","mar","tájfun","rápillant","metropolita","felszíni","kiutasítás","rosszhiszeműség","spanyollovas","konvoj","tárgyiasít","mániás","ürülés","ágyaz","becsülettel","jóvágású","múlandó","cukros","jegygyűrű","huncutkodó","spanyolos","vad","emberhez","éjszakát","összefüggésben","bibeszál","emeli","simító","mentegető","képzetsor","bravúrosan","tényező","gúnyiratban","ártér","elintézési","füttypont","káromkodó","díjaz","gumi","gyúr","nadrágszíjat","dutyiban","matrózgallér","megbűnhődés","kipukkadás","bankkövetelés","smaragdzöld","cár","nehézlövedék","szilvaszínű","szvetter","állítva","pazarló","vádlottak","tartósság","kempingszék","elmarhulja","iránytartó","fehérfejű","disszidálás","kétszeri","mégsem","precedens","hálóhelye","szénraktár","elszíneződött","vénusz","szimpatizál","betegkoszt","intellektualizál","megdöntője","tünet","sommás","térden","lovaknak","fegyvercsattogás","töltés","sejtet","titok","őslénytan","lánytestvér","kiskorú","talpon","szórakozó-móló","talajfények","ismerem","felfalazás","marháé","kiszipolyozás","önsanyargatás","mitológia","elszakítja","kerülőt","őrjárat","nyár","egytől","kire","szerepkönyv","szonettköltő","antikvitások","jelöl","garde","kipurcant","kettészakít","kémcső","kékporral","szereplő","spiccel","kapcsolatszervezés","fasíroz","hasizom","fajtalankodó","kisatlasz","epizódszerepekben","kétszer","mirigy","özön","szamovár","nyughely","képtranszformátor","kimosódás","szentelve","középvonalból","csór","toszakodás","nyájasság","akusztikus","tízórai","becsukódik","ellenméreg","nyomdában","skalpol","csónakázni","becsavarja","birslekvár","félkész","lefokozás","koalíciós","kollégiumhoz","reformáció","ősszláv","jóhiszeműség","robotautomata","agancs","visszásságot","csatorna","borfajta","gácsér","írásmód","fekhelye","ágyúcsőfogantyú","szószaporítás","akarattal","felbukkan","előlegzett","szakácssegéd","átadja","övék","jellemvonás","véleménynyilvánítás","megduzzad","vendéglátás","vád","válasza","kilátókocsi","visszautasítás","hatókör","hozzáedződik","kísértő","kezes","megegyezik","megkülönböztethetetlen","darabka","bohémmé","beépít","készülődik","megerőszakolás","miniszterelnöki","hősugárzás","kuplé","csapágytest","vámvizsgálat","csüggedt","oromfal","rugalmassá","galvanizálás","ülésszak","repülőgép-anyahajó","elismerő","keserűség","részben","kocsielőtér","esküdtszék","elvtelen","meglegyint","tudálékosság","lojalitás","eutrófia","szőlőlevéldísz","szitkokat","világosabbá","megfejel","munkavállaló","kezdeményezőkészség","leszállóban","premoláris","repülőtiszt","műbútorasztalos","hűhó","házasságképes","vezérevezős","motorja","karcsúsít","szógyakorisági","széttépés","szénpad","csőtorkolat","elterpeszkedik","ólom","istentiszteleti","mellvéd","pisztolylövéssel","megcsípés","hűtőház","elkésettség","ejektor","fedélzetű","lealáz","vezércsillag","elvetése","szitavászon","szerelemre","talajtan","hízelgően","féltékenység","szocializálás","nőnek","folyadékmozgás","abcúgol","ácsi","matrózúszás","gyámoltalanság","odavezetés","kantinos","merülési","hősködő","foglalkozási","kívánok","képességét","kötőgerenda","elgőzölögtetés","megszerettem","túlmelegszik","törülközik","tengelykapcsoló","monitor","adapter","helyesírási","habszerű","nőtlenségben","közhasználatra","falain","udvari","töltéskapcsoló","miből","erősnek","elgyöngít","bájaitól","szőnyeget","utóhatás","kultivátor","nőbolondító","jellemzés","madártan","megrendülés","lábbal","színlegesen","prémez","víziszony","állófogas","kicsattint","főnemesség","krisztus","fajtájú","hálókocsijegyet","mucikám","rajzszög","világhoz","tömegszórakoztató","állattani","mellérendelt","dombornyomás","mértéktartó","gyógyfűkereskedő","nyomtató","kissebségi","hadsereg","ráfordít","szentségi","lefoglalási","ellop","hozzátartozik","feladatkör","gonoszkodás","vízmosás-kötés","gyógyszeroldat","műkifejezés","kokit","töviről","mást","végzetes","csomóponti","analógiája","szövetfelület","esetlen","napszúrást","molnár","cintányér","keményfejű","karbolsav","berreg","általi","szemfedővel","alj","vermikulit","elmesélés","gombfejű","szülészorvos","teletömi","szívóka","szakítani","naplementéig","karika","kikötőhíd","szobor","segédcsapatok","ragadósság","tudatküszöb","parlament","ízel","hangfogós","nyűg","alagútfúró","bekenés","felvehető","bronzkor","eleji","sarokoszlopos","testvérek","szeszélyes","sasszeg","kauzalitás","megszerzésére","tekézés","térköz","honorál","technikai","családfő","hittérítő","folyószámlád","lustán","bevégez","összeteker","compó","trombitál","csengőzsinór","konferencián","hülye","lángoló","ritkít","irány","tekint","ráüzen","tépelődik","tekervényes","fantáziátlan","lüktető","féloldali","gőzölgő","szerzetesi","fegyelmezetlenül","elmetsz","ló","újonc","parasztság","színi","utólagos","megadva","kápráztató","láncfonál","elzárul","absztrakció","alkalmazás","praktikus","kölnivíz","nüansz","kidolgozás","erődítmények","kokottban","emeletfedélzet","férfiatlanít","holdutazás","lyukasztó","sorsjegy","lehűtéssel","székelés","tanulságos","odaad","felold","rosszindulatúan","címezve","áramvonal","hósapkás","meszelés","leküzdhető","tilos","nyakpántos","ellenjegyzése","szegecsfejező","zászlóshajó","maratószer","oszkulálás","látóköri","ablaktörlő","szajré","flokkulál","csajka","társaság","beltag","csülök","hová","fattyúzsineg","akivel","periféria","töltésút","bezáródás","vannak","úton-módon","evőkanál","ujjas","ceruzavég","megújít","ütött-kopott","programja","váratlan","lédússág","cölöpöz","kaszás","vulkáncsatorna","vacsoraidő","pólyatekercs","csípőfogó","párosan","omlett","élelemadag","segglyuk","hevertetés","megcsináltat","tanulója","kiglancolt","hitelű","plüss-szőnyeg","feltüzel","kuss","tisztességtudó","szindikátus","sótermelő","gyáregység","eltűnt","referens","kipárologtat","papírlemez","akit","boltívet","betekintés","lehajlik","haj","átalakít","árnyalatai","ketyegő","fejtető","falapát","totojázó","magamnak","sérthetetlen","lumpolni","diploma","expeditív","katonaszökevény","arbitrázs","fenegyerek","utóélet","figyeli","haditanács","hajópalánkolás","összekap","billentőkocsi","ablakkeret","ruhátlan","impulzív","hegyvidék","babaarcú","felfegyverzés","réteghiány","megkártyáz","porít","megtöm","sebész","átugorja","beburkol","korruptság","pinka","expedíció","megmintáz","kazánkovács","sarkantyúcsont","repedezett","hamuszürke","birkanyírás","bizonyítására","homok","előnye","épülettorony","mosólap","kat-vitorlázatú","apropó","elhelyez","elvégzett","ötszörös","csüggedj","öngyilkosság","lökhajtás","levegőhiány","parancsolgat","chile","bárányt","enyhítő","zsákutcába","kifosztja","szakított","hangszeres","kacagtató","görbén","teljesített","átütéses","megbuktat","befejezetlenül","békával","köret","tenyérrel","villámháborús","leomló","zárószerkezet","emelővilla","arthritis","kiáltványt","megállapít","bibeszáj","ökölcsapást","fűtőanyag","megtelepedés","animizmus","festékez","eldumálgat","beveri","mennél","istenek","elromlik","mangosztán","felsőpályás","kötésterv","köteleiről","varázsjel","tantétel","pénzes","rémít","nyű","fejedelmi","dráma","oceanográfus","szintjel","kerítőnő","büntetőjog","gyámoltalan","összegek","térerősség","adásvétel","húzódik","szemlét","karavánkocsi","gúnár","penzióban","szálfa","pletykázás","szikratávírás","rudak","vaskapocs","ökölvívó-mérkőzés","orsók","darabja","hajcsár","ütközetbe","fojtást","jogorvoslat","hozzáillesztés","szállodába","paszományáru","székrekedést","rézfúvósok","sorrendi","dőlési","bűnjel","fojtó","vesztegzárhajó","támasztórúd","legaluli","versenyistálló","fejtési","csengő","hasnyálmirigy","szablya","testedzés","olajtartály","forgácsterelő","csörgedezés","meggyőzően","nonkonformista","hűtésre","tervezőként","visszailleszt","megenyhülve","lezárás","sorhajó","hitelkövetelés","lemetsz","pörköl","becukroz","fuvolázik","vakít","dévérkeszeg","megveregeti","összecsavarodik","hajótörés","bakkecske","szétrepedés","kibélel","mérőelektróda","matracágy","dugaszalj","ellenajánlatot","használhatatlan","speciális","lángkicsapódás","keres","esély","napnyugta","borús","útbaigazítást","porráőrlő","védőügyvéd","készpénzkassza","szolgálatért","bennragad","nyugtató","belesüpped","túlbuzgóság","eloszt","elhivatottság","languszta","pácban","megszavaz","gondterhes","szűkszavú","szállítás","ösztöne","felnyal","tehervonat","fiútestvér","pénzeslevelű","haladását","cizellálás","előkészület","ajtónyílás","dolgod","elővigyázatlanná","hánykolódó","próbálgatja","anagrammakészítés","segélykocsi","fehér","agyondolgozott","árkot","himbál","legalsó","humoros","bűnpártolás","érvelő","teszi","krizokalk","aknavetős","feketekávézás","barátságos","kunyerál","megélhetés","bukik","rajong","falra","cselt","csúzos","sublót","nyafogva","jegylyukasztás","kisisten","mentőkabin","mártogató","kedvben","dobhártya","hőlégsugár","csúszósín","lepárol","kihallgatást","láttamoz","sellő","boltoz","összeesküvés","kockakő","takarmánypépesítés","sorompórúd","megvertél","kiaknázás","elpuhító","észrevenni","esszé","tüdőtágulásos","akkorra","davy-lámpa","cajgvászon","megvendégel","kapkod","glissando","őskor","életrajzíró","sótelep","újperzsa","négyoldalúra","léghólyag","rekkenő","rettenetesen","kén","szarong","prózaian","visszagurít","gumimatrac","tisztség","mérv","gyermekkorban","kékcsóka","szürkéssbarna","firkálgat","szavakba","cézár","meggondolatlan","választói","kintlévőségek","arckifejezés","zúzalék","sompolyog","mestere","fogvájó","leveled","jogátruházás","lópáncél","lépesméz","bizonyulás","takarót","rovarokat","ajtóval","bélel","nyomdászati","rímelés","emberségesen","kifújják","tartózkodik","kilyukadt","parkosít","lehallgatókészüléket","keresztszülő","hamisítatlan","vitorlaléc","tört","tennessee","légáramlásos","hamuszürkévé","gyújtva","kedvemre","kutyagumit","folytonosan","ebek","lágyára","alagutat","tárgyalja","befűződés","illuminátusok","strandoló","visszás","határokon","áttekintés","utánvételezett","kételkedés","löket","rakétatudomány","szelektor","dönget","gyomlál","hagyd","meglátod","sziruppal","sokkal","gurító","arcmás","tyúkeszű","felnyitható","árul","folyóirat","feszítőcsavar-anya","sprintúszás","fogyasztást","évad","megzavarodik","nagyvárosi","alapszerűen","redőtlen","párthoz","szándékában","perel","káin","átszállítás","dörgés","pechszéria","indirekt","gyertyánfa","mazochizmus","szorul","dolgoztam","cseresznyefa","fejtegetés","szekularizáció","militarizál","rózsás","emberke","házába","flóderozás","bátorító","radarjel","játékbarlangban","moszat","keményítő","elpuhul","kondícióban","osztályjelentés","sugalmazás","trikóruha","salakkő","érintése","szervezetlen","gyakorító","önmegtartóztató","honi","laposszárú","szabadjárat","győztes","francia","vonaglás","siesd","összemenés","szűkös","smacizás","szállít","erről","fehérmályva","válaszadó","önmagáról","könnyűség","szépia","eszem-iszommal","ütközési","szűrőkendő","termosz","gyomorrontást","kokott","indító","arclemosó","potyautas","álcázás","meghökkenti","erdőművelés","posztókikészítő","vacogás","pukkantó","villanyborotva","szomorú","forrasztócső","darabszám","szellemtelen","arcrándulás","rétegkialakítás","baldachint","varázsló","népes","kihímez","ellenszegülés","fonalvéget","hagymatető","boszorkányüldözés","buca","tőzsdeképes","marófúró","aranyfüst","barlang","ádáz","fogadalmak","tömedék","kollegalitás","odalép","körzetet","gyümölcsét","húzódó","hajtófa","szolgálatban","hangyasavas","újabbat","karambolszéria","rizspapír","lebocsátás","ruhatáros","nyiladék","szédülök","biztosításra","játék","fotogravure","megcsonkítás","tücsök","rekettyés","beszűkülés","szétver","ablaksor","teozófia","összkomfortos","ármánykodó","illetlenül","süpped","túli","maszat","látványos","szövegfilmezés","jogfeladás","önszántából","ridegség","formáját","egyházközségi","önsebesség","lapszámoz","viszonos","erély","kiszolgáltatva","magánlakosztály","kipanamáz","kitérés","szakosított","nadrágtartó","gondolatától","öltözött","töredékes","elvből","terjeszt","bevagdal","térfogat-elemzési","gyanúba","koriander","víztároló","szétpukkadás","semmiért","bejelentőlap","kézfogás","rum","iszonyodom","malomkő","próbaút","átkel","beosztja","priusza","autóé","göröngy","caesar","handabandázás","érvekre","feltekercsel","ingyenélő","sürgés-forgás","flitterez","félrelép","dőzsölő","álborda","tételekre","börtönparancsnok","pát","bemaródik","felhajtott","kupán","elrepülés","kavarogva","lelkének","gép-alapterület","lenyűgözve","villásreggeli","egyiket","bemelegszik","oszlopban","felkavarodó","kötszövött","tűzvédelem","lázban","vonalakkal","repülés","gúnnyal","újrateremtés","simaszőrű","soványít","nyüszítő","etap","feldühödve","kézjel","öszvér","kánság","ingerültség","szemnek","lábujj","lábköz","kiáltást","bakelizál","helyőrségi","szillogisztikus","transzcendencia","üzemanyag","határok","szagtalan","szalonzene","írói","bánatosan","cipő","gyorsforraló","vaslemezt","végzik","tollrost","telke","napközi","adalékos","köszörűkorong-egyengető","előhevítés","víztározó","művelésű","készletek","korban","művi","erőteljes","tunika","tolódás","szelek","veres","mámorossá","arányba","teherben","nyersbőr","megdönt","gerendázatra","vádlón","burgundia","ganglion","lebiztosít","elszigetel","ágcsonk","szemtükör","trutyis","kabátzseb","ellenérzést","ízében","fokozza","felver","bú","acetilén","elcsattanó","rézpénzdarab","keverék","perselyezés","államadósság","pénztárablak","páratlanul","kristálygömb","állásától","slingelés","nagyhangúság","homokos","hasad","megváltoztathatatlanul","számokból","passzátszelek","név","eperoham","öreglány","bíboros","privilégium","konyha","kulcstoll","petitio","ösztön","dologban","jegesmedve","programozás","kórusegylet","kenguru","bélhúr","házat","biztosításról","bizottsági","csel","öregítés","félrehúzódik","eldugott","magasan","kiknek","műlesiklás","szurokkal","újjászületik","legalul","tetemvizsgálat","zsebszámológép","áttetsző","vadság","tapétáz","szerelési","ellenségesen","ugrókötél","megerőltetés","eres","huncutkodás","borsfű","tejsodó","felsőosztályos","fogva","dukkozólakk","felrázódik","kibombáz","légihídon","mozsárágyú","sarkos","túrós","szállítóvályú","megszokik","hozzávetőlegesen","udvarló","öcsi","pünkösdvasárnap","folyóvíz","műmellékletek","megtizedel","kirándulás","befolyásoló","visnu","lépcsőzetesen","halotthamvasztási","törvény","vészkijáratzár","zabkásaleves","gabonanemű","bukrám","prépostság","pányva","összeterelése","rádión","intézi","nemtörődöm","sorsába","diagonális","fedezetek","törölközőt","biztató","megnövekedett","osztozás","haszonelvűség","meghűl","úrrá","forgatás","palaelógus","vízipoloska","délnyugati","ölti","lecsillapít","hagyjuk","nyurgul","becsípettség","aranyásó","kisiklat","csúszkálva","képeslap","tahó","ájultság","dugás","előrejut","magánlevél","ruta","szolgáltatások","kapcsolattal","előmelegítő","előrehaladó","épségben","átkarol","bizalom","opálfényű","köze","letorkol","töredékeit","fényjátékos","bubópestis","táborhely","hátszéllel","mellé","fejez","liturgia","bőséggel","írral","szertelen","foltosság","rádió-távirányítású","felfogja","ablakfélfa","félelemérzés","tisztségéről","állattenyésztő","eszénél","egészen","értéknövekedési","riporterstílus","illetlenség","kabátba","tisztességtelen","szélét","hozzánk","vis","döntés","csapfúró","tőrrel","turbógenerátor","megüresedik","tenyészt","rázogat","hajóroncsrabló","lerakás","elvégezve","átugrás","viszontlátásra","adszorpció","pózna","utaslépcső","múlékonyság","lezáró","ésszerűtlen","megvonalaz","utókezel","iramban","tönkre","másod","augusztus","seprű","versenyezhet","maradéktalanul","húron","égésszabályzó","hizlal","írógéphenger","öntudat","illékonyság","szemlélés","vízbeesés","töménységi","nekihevül","ádámcsutka","beindít","szir-szar","vizuális","századik","élére","mozdulj","habarcsot","csiga","forgalom-kimutatás","elfolyósítás","szatócs","felkel","gördítés","irányítóközpont","tejpor","szabatosság","keresztkérdés","osztalékon","kosz","húzópad","időszakos","nagyzolás","kivételesen","megdorgál","vámterület","kubatúra","hamutartó","ismeretlen","forgalomelterelő","cserépbödön","megszűnés","adótorony","feladatát","mag","betűnagyság","kongó","helyezkedő","trónra","nosztalgiázva","csavarodó","műalkotás","kidörzsöl","keresni","elzárt","kúszó","kicsipkéz","ezüstérme","alávág","robbanótöltet","cölöpfej-toldás","megtörten","szurokérc","ellenérték","rézcent","lenmag","kristálymérés","zsombékos","labdacs","önlebecsülés","profilvas","kúpos","gravíroz","elékelt","szépítés","ruhafestő","hárombázisú","felületen","alkalmazása","körletrend","baka","fülescsavar","sejtem","ihatatlan","gyümölcsfa","kuglizó","nevetségesség","gumitalpú","csapda","befejezés","hálócsomózás","mirabolan","kánaán","felvétele","ledöglik","megpipál","kifogásolás","keresett","beadvány","uzsorabérrel","mocsoktalan","hajdan","gyapotmagtalanító","bombaként","magát","ellenőrzött","szétdobott","készségesség","üszkösség","szórakozásból","epekedő","kiszivárgás","pacientúra","gumicsizma","szorítókötél","korszerűtlenség","akadozik","szőlőfürt","adjusztál","vöröshasú","itallap","humánusan","felhajtósáv","kidögleszt","igazolást","majom","peckesen","kicsihol","átgázoltat","borotvaéles","elvként","fölösödni","hájfej","levegőbuborék","védőálarc","poggyászháló","fokoz","lovai","előírásos","elárusító","tőrbe","kristálytan","hatásos","betódulás","szögvágó","kirúzsoz","nyilvánít","dekódolás","eltűrő","kéjutazás","poggyászzsák","elhamarkodottan","elveszett","ívcső","falsos","fez","földrajzi","húzókút","művelhető","keletkeznek","megfest","legcsekélyebb","felszólít","újrarendez","órás","munkafelfüggesztés","epebeteg","szájhős","mammut","csalafinta","sebészeti","topográfiai","patentíroz","zenedarabot","elkerülhetetlen","földbe","beszűrődés","kosárlabda","bombabiztos","következtetni","tréfából","városokba","zsinórpadlás","zsidógyűlölő","pince","megüzen","papucs","felbecsülés","szabadkőművesség","kékgáz"],

	generatePassPhrase: function(container) {
		var $container = $(container);

		$container.find(".account_phrase_generator_steps").hide();

		$container.find("textarea").val("");

		var crypto = window.crypto || window.msCrypto;

		if (crypto) {
			$container.find(".step_2").show();
			$("#account_phrase_generator_start").show();
			$("#account_phrase_generator_stop").hide();

			bits = 128;

			var random = new Uint32Array(bits / 32);

			crypto.getRandomValues(random);

			var i = 0,
				l = random.length,
				n = this.wordCount,
				words = [],
				x, w1, w2, w3;

			for (; i < l; i++) {
				x = random[i];
				w1 = x % n;
				w2 = (((x / n) >> 0) + w1) % n;
				w3 = (((((x / n) >> 0) / n) >> 0) + w2) % n;

				words.push(this.words[w1]);
				words.push(this.words[w2]);
				words.push(this.words[w3]);
			}

			this.passPhrase = words.join(" ");

			crypto.getRandomValues(random);

			$container.find(".step_2 textarea").val(this.passPhrase).prop("readonly", true);

			setTimeout(function() {
				$("#account_phrase_generator_start").hide();
				$("#account_phrase_generator_stop").fadeIn("slow");
				$("#custom_passphrase_link").show();
			}, 1500);
		} else {
			$container.find(".progress-bar").css("width", "0%");
			$container.find(".progess-bar span").text("0% seeded");
			$container.find(".step_1").show();

			Math.seedrandom();

			$("html").on("mousemove", function(e) {
				var seed = [e.pageX, e.pageY, +new Date];
				PassPhraseGenerator.push(seed);

				var percentage = PassPhraseGenerator.percentage() + "%";

				$container.find(".progress-bar").css("width", percentage);
				$container.find(".progress-bar span").text(percentage + " seeded")

				if (PassPhraseGenerator.isDone()) {
					$container.find(".progress-bar").css("width", "100%");

					$("html").unbind("mousemove");

					$container.find(".step_1").hide();
					$container.find(".step_2").show();
					$("#account_phrase_generator_start").hide();
					$("#account_phrase_generator_stop").show();
					$("#custom_passphrase_link").show();

					var words = [];

					for (var i = 0; i < 12; i++) {
						var number = Math.floor((Math.random() * PassPhraseGenerator.wordCount) + 1);
						words.push(PassPhraseGenerator.words[number]);
					}

					Math.seedrandom();

					PassPhraseGenerator.passPhrase = words.join(" ");

					$container.find(".step_2 textarea").val(PassPhraseGenerator.passPhrase).prop("readonly", true);
				}
			});
		}
	},

	reset: function() {
		this.passPhrase = "";
		this.seeds = 0;
	}
}