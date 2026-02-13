export interface University {
    rank: number;
    university_name: string;
    city: string;
    type: string;
    popular_english_programs: string[];
    min_cgpa: string;
    ielts_requirement: string;
    gre_required: string;
    annual_tuition_fee_inr: string;
    estimated_annual_living_cost_inr: string;
    program_duration_years: string;
    avg_starting_salary_inr: string;
    employment_rate: string;
    post_study_work_visa: string;
    visa_risk: string;
    website: string;
    source: string;
    country: string;
    slug: string;
}

export interface CountryInfo {
    code: string;
    name: string;
    flag: string;
    count: number;
}

const COUNTRY_FILES: Record<string, string> = {
    canada: 'Canada_uni.txt',
    germany: 'Germany_uni.txt',
    uk: 'UK_uni.txt',
    australia: 'Australia_uni.txt',
    usa: 'USA_uni.txt',
};

const COUNTRY_NAMES: Record<string, string> = { canada: 'Canada', germany: 'Germany', uk: 'United Kingdom', australia: 'Australia', usa: 'United States' };
const COUNTRY_FLAGS: Record<string, string> = { canada: '🇨🇦', germany: '🇩🇪', uk: '🇬🇧', australia: '🇦🇺', usa: '🇺🇸' };

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

const cache: Record<string, University[]> = {};

async function fetchCountryData(country: string): Promise<University[]> {
    const key = country.toLowerCase();
    if (cache[key]) return cache[key];

    const fileName = COUNTRY_FILES[key];
    if (!fileName) return [];

    try {
        const res = await fetch(`/University_data/${fileName}`);
        const data = await res.json();
        const unis: University[] = data.map((u: any) => ({
            ...u,
            country: key,
            slug: generateSlug(u.university_name),
        }));
        cache[key] = unis;
        return unis;
    } catch (err) {
        console.error(`Failed to load university data for ${country}:`, err);
        return [];
    }
}

export async function getAllUniversities(): Promise<University[]> {
    const all: University[] = [];
    for (const code of Object.keys(COUNTRY_FILES)) {
        all.push(...(await fetchCountryData(code)));
    }
    return all;
}

export async function getUniversitiesByCountry(country: string): Promise<University[]> {
    return fetchCountryData(country);
}

export async function getUniversityBySlug(country: string, slug: string): Promise<University | undefined> {
    const unis = await fetchCountryData(country);
    return unis.find(u => u.slug === slug);
}

export async function getAvailableCountries(): Promise<CountryInfo[]> {
    const countries: CountryInfo[] = [];
    for (const code of Object.keys(COUNTRY_FILES)) {
        const unis = await fetchCountryData(code);
        countries.push({
            code,
            name: COUNTRY_NAMES[code] || code,
            flag: COUNTRY_FLAGS[code] || '🌍',
            count: unis.length,
        });
    }
    return countries;
}

export function searchUniversities(
    universities: University[],
    query: string,
    filters?: {
        greRequired?: string;
        visaRisk?: string;
        programKeyword?: string;
    }
): University[] {
    let results = [...universities];

    if (query) {
        const q = query.toLowerCase();
        results = results.filter(u =>
            u.university_name.toLowerCase().includes(q) ||
            u.city.toLowerCase().includes(q) ||
            u.popular_english_programs.some(p => p.toLowerCase().includes(q))
        );
    }

    if (filters?.greRequired === 'no') {
        results = results.filter(u => u.gre_required.toLowerCase().startsWith('no'));
    }
    if (filters?.greRequired === 'yes') {
        results = results.filter(u => u.gre_required.toLowerCase().startsWith('yes'));
    }

    if (filters?.visaRisk) {
        results = results.filter(u => u.visa_risk.toLowerCase() === filters.visaRisk!.toLowerCase());
    }

    if (filters?.programKeyword) {
        const kw = filters.programKeyword.toLowerCase();
        results = results.filter(u =>
            u.popular_english_programs.some(p => p.toLowerCase().includes(kw))
        );
    }

    return results;
}
