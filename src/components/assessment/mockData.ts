// src/components/assessment/mockData.ts
import { Endpoint } from '../../types/assessment';

export const mockEndpoints: Endpoint[] = [
  { url: 'https://example.com/api/users', isAttackable: false },
  { url: 'https://example.com/api/login', isAttackable: false },
  { url: 'https://example.com/api/admin', isAttackable: false },
  { url: 'https://example.com/api/users/123', isAttackable: false },
  { url: 'https://example.com/api/search', isAttackable: false },
  { url: 'https://example.com/static/css/main.css', isAttackable: false },
  { url: 'https://example.com/static/js/app.js', isAttackable: false },
  { url: 'https://example.com/images/logo.png', isAttackable: false },
  { url: 'https://example.com/api/health', isAttackable: false },
  { url: 'https://example.com/api/config', isAttackable: false },
  { url: 'https://example.com/api/payment', isAttackable: false },
  { url: 'https://example.com/api/profile', isAttackable: false },
];

export const mockTools = {
  network: [
    {
      id: 'nmap',
      name: 'Nmap',
      description: 'Network discovery and security auditing tool',
      category: 'Network',
    },
    {
      id: 'masscan',
      name: 'Masscan',
      description: 'Fast port scanner for large networks',
      category: 'Network',
    },
    {
      id: 'nikto',
      name: 'Nikto',
      description: 'Web server scanner',
      category: 'Network',
    },
  ],
  dast: [
    {
      id: 'zap',
      name: 'OWASP ZAP',
      description: 'Dynamic Application Security Testing tool',
      category: 'Web Application',
    },
    {
      id: 'burp',
      name: 'Burp Suite',
      description: 'Web application security testing platform',
      category: 'Web Application',
    },
    {
      id: 'sqlmap',
      name: 'SQLMap',
      description: 'Automatic SQL injection and database takeover tool',
      category: 'Web Application',
    },
  ],
  web: [
    {
      id: 'zap',
      name: 'OWASP ZAP',
      description: 'Dynamic Application Security Testing tool',
      category: 'Web Application',
    },
    {
      id: 'burp',
      name: 'Burp Suite',
      description: 'Web application security testing platform',
      category: 'Web Application',
    },
    {
      id: 'wpscan',
      name: 'WPScan',
      description: 'WordPress security scanner',
      category: 'Web Application',
    },
  ],
  server: [
    {
      id: 'openvas',
      name: 'OpenVAS',
      description: 'Vulnerability scanner for servers',
      category: 'Infrastructure',
    },
    {
      id: 'nessus',
      name: 'Nessus',
      description: 'Vulnerability assessment tool',
      category: 'Infrastructure',
    },
    {
      id: 'nmap',
      name: 'Nmap',
      description: 'Network discovery and security auditing tool',
      category: 'Network',
    },
  ],
};

