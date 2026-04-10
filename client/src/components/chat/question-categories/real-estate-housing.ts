import { Home } from "lucide-react";
import type { QuestionCategory } from "./types";

export const REAL_ESTATE_HOUSING: QuestionCategory = {
  category: "Real Estate & Housing Economics",
  icon: Home,
  questions: [
    "Hedonic pricing model for US residential real estate: estimating implicit prices of housing attributes (bedrooms, sqft, year built, pool, garage) using 839K Zillow listings across 50 states",
    "Research on climate risk capitalization in US housing markets: do flood, fire, heat, and wind risk factors reduce property values? Spatial panel analysis with 839K listings",
    "Spatial econometrics study on school quality capitalization: how nearby school ratings affect house prices controlling for neighborhood and structural characteristics",
    "Paper on the Zestimate accuracy and housing market efficiency: comparing Zillow automated valuations to listing prices across property types and geographies",
    "Academic study on property tax assessment fairness: do assessed values diverge systematically from market prices by neighborhood income, race, or property type?",
    "Research on housing affordability and rent-to-price ratios: estimating gross rent yields across US metros using Zillow listing and rent estimate data",
    "Paper on the urban-suburban price gradient: hedonic decomposition of the city premium using walkability scores, transit access, and commute proxies",
    "Empirical analysis of the HOA fee premium: do homeowners associations increase or decrease property values after controlling for amenities and location?",
    "Study on housing market segmentation: latent class analysis of US property listings revealing distinct sub-markets by price tier, geography, and property characteristics",
    "Research on the green premium in US housing: do energy-efficient construction materials, newer builds, and climate resilience features command higher prices?",
    "Paper on luxury housing determinants: what drives the top decile of property prices? Waterfront, lot size, spa, fireplace count, and location interaction effects",
    "Academic study on housing price dispersion within ZIP codes: measuring intra-neighborhood inequality and its determinants using 839K Zillow listings",
    "Research on days-on-market determinants: survival analysis of listing duration using property features, pricing strategy, and local market conditions",
    "Paper combining FRED macro data with Zillow micro data: how do mortgage rates (DGS30), unemployment (UNRATE), and CPI affect local housing prices across US states?",
    "Empirical analysis of property age depreciation curves: estimating non-linear year-built effects on price per square foot across home types and regions",
  ]
};
