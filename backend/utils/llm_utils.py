import os
import re
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def scrape_job_posting(url):
    """
    Scrape content from a job posting URL
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML content
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
        
        # Get text content
        text = soup.get_text(separator=' ', strip=True)
        
        # Clean up text (remove extra whitespace)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Truncate if too long (context window limitation)
        if len(text) > 15000:
            text = text[:15000] + "..."
            
        return text
    except Exception as e:
        print(f"Error scraping job posting: {e}")
        return None

def analyze_job_posting_with_llm(text):
    """
    Analyze job posting text using OpenAI API
    """
    if not text:
        return None
    
    try:
        prompt = f"""
        You are an expert job application assistant. Analyze the following job posting text and extract the key information.
        Return the results in JSON format with the following fields:
        - company: The company name
        - role: The job title/role
        - salary: The full salary text as mentioned in the posting (if available)
        - salary_amount: The numeric salary amount (if available, otherwise 0)
        - salary_currency: The currency of the salary (PLN, EUR, USD, GBP, etc.)
        - salary_type: The type of salary (hourly, monthly, yearly)
        - date_posted: The date the job was posted (in YYYY-MM-DD format if available)
        - skills: A list of key skills required for the job
        - experience: The required experience level
        - location: The job location
        
        If any information is not available, use null or empty values. For salary_amount, use 0 if not available.
        For salary_currency, default to "PLN" if not specified.
        For salary_type, default to "yearly" if not specified.
        
        Job Posting Text:
        {text}
        """
        
        response = client.chat.completions.create(
            model="gpt-4-turbo",  # Use an appropriate model
            messages=[
                {"role": "system", "content": "You are a job posting analyzer that extracts structured data from job descriptions."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        result = response.choices[0].message.content
        return result
    except Exception as e:
        print(f"Error analyzing job posting with LLM: {e}")
        return None

def process_job_posting_url(url):
    """
    Process a job posting URL: scrape content and analyze with LLM
    """
    # Scrape the job posting
    content = scrape_job_posting(url)
    if not content:
        return {
            "error": "Failed to scrape job posting content"
        }
    
    # Analyze with LLM
    analysis = analyze_job_posting_with_llm(content)
    if not analysis:
        return {
            "error": "Failed to analyze job posting content"
        }
    
    return analysis
