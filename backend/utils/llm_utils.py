import os
import re
import json
import requests
import traceback
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key and print a masked version for debugging
api_key = os.getenv('OPENAI_API_KEY')
masked_key = f"{api_key[:4]}...{api_key[-4:]}" if api_key and len(api_key) > 8 else "Not found"
print(f"OpenAI API Key (masked): {masked_key}")

# Import and configure OpenAI with v0.28 compatibility
import openai
openai.api_key = api_key

def scrape_job_posting(url):
    """
    Scrape content from a job posting URL
    """
    print(f"\n[DEBUG] Scraping job posting from URL: {url}")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        print("[DEBUG] Sending HTTP request...")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        print(f"[DEBUG] HTTP request successful. Status code: {response.status_code}")
        
        # Parse HTML content
        print("[DEBUG] Parsing HTML content...")
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
        
        # Get text content
        text = soup.get_text(separator=' ', strip=True)
        
        # Clean up text (remove extra whitespace)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Truncate if too long (context window limitation)
        original_length = len(text)
        if len(text) > 15000:
            text = text[:15000] + "..."
            print(f"[DEBUG] Text truncated from {original_length} to 15000 characters")
        else:
            print(f"[DEBUG] Extracted text length: {len(text)} characters")
            
        return text
    except Exception as e:
        print(f"[ERROR] Error scraping job posting: {str(e)}")
        print(traceback.format_exc())
        return None

def analyze_job_posting_with_llm(text):
    """
    Analyze job posting text using OpenAI API
    """
    if not text:
        print("[ERROR] No text provided for analysis")
        return None
    
    print(f"\n[DEBUG] Analyzing job posting text ({len(text)} characters)")
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
        
        IMPORTANT: Your response must be valid JSON format only, with no additional text before or after the JSON.
        
        Job Posting Text:
        {text}
        """
        
        print("[DEBUG] Sending request to OpenAI API...")
        # Test network connectivity to OpenAI
        try:
            conn_test = requests.get("https://api.openai.com/v1", timeout=5)
            print(f"[DEBUG] Connection test to OpenAI API: Status code {conn_test.status_code}")
        except Exception as conn_err:
            print(f"[ERROR] Connection test to OpenAI API failed: {str(conn_err)}")
        
        # Use OpenAI v0.28 format with a current model
        print("[DEBUG] Creating OpenAI ChatCompletion...")
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a job posting analyzer that extracts structured data from job descriptions. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        print("[DEBUG] OpenAI API request successful")
        result = response.choices[0].message.content.strip()
        print(f"[DEBUG] Response length: {len(result)} characters")
        print(f"[DEBUG] Raw response: {result}")
        
        # Try to parse the result as JSON to validate it
        try:
            # Try to extract JSON if it's wrapped in markdown code blocks or other text
            if result.find('{') >= 0 and result.rfind('}') > result.find('{'):
                potential_json = result[result.find('{'):result.rfind('}')+1]
                json_result = json.loads(potential_json)
                print("[DEBUG] Successfully extracted and parsed JSON from response")
                # Convert back to string for consistent return type
                result = json.dumps(json_result)
            else:
                # Try parsing the whole response as JSON
                json_result = json.loads(result)
                print("[DEBUG] Successfully parsed response as JSON")
                # Convert back to string for consistent return type
                result = json.dumps(json_result)
        except json.JSONDecodeError as e:
            print(f"[WARNING] Response is not valid JSON: {str(e)}. Returning default JSON.")
            # Create a default JSON response with the raw text included
            default_json = {
                "company": "Unknown",
                "role": "Unknown",
                "salary": None,
                "salary_amount": 0,
                "salary_currency": "PLN",
                "salary_type": "yearly",
                "date_posted": None,
                "skills": [],
                "experience": None,
                "location": None,
                "raw_response": result
            }
            result = json.dumps(default_json)
        
        return result
    except Exception as e:
        print(f"[ERROR] Error analyzing job posting with LLM: {str(e)}")
        print(traceback.format_exc())
        return None

def process_job_posting_url(url):
    """
    Process a job posting URL: scrape content and analyze with LLM
    """
    print(f"\n[DEBUG] Processing job posting URL: {url}")
    
    # Scrape the job posting
    content = scrape_job_posting(url)
    if not content:
        print("[ERROR] Failed to scrape job posting content")
        return {
            "error": "Failed to scrape job posting content"
        }
    
    # Analyze with LLM
    analysis = analyze_job_posting_with_llm(content)
    if not analysis:
        print("[ERROR] Failed to analyze job posting content")
        return {
            "error": "Failed to analyze job posting content"
        }
    
    print("[DEBUG] Successfully processed job posting URL")
    return analysis
