# Accessibility

ARICT wants students to find and use past papers across devices and access needs. Repository maintainers coordinate accessibility work for the portal and its contribution process.

Our improvement target is [WCAG 2.2 Level AA](https://www.w3.org/WAI/standards-guidelines/wcag/). This is a development goal, not a statement that the portal has passed a complete accessibility audit.

## Report a barrier

Open an [accessibility issue](https://github.com/Association-of-Rajarata-ICT/arict-paper-portal/issues/new?template=03-accessibility.yml), or email [arict@as.rjt.ac.lk](mailto:arict@as.rjt.ac.lk) if you prefer a private channel or cannot use GitHub's form.

Describe the task and where it became difficult. A page link, reproduction steps, browser or assistive technology details can help, but are optional. Screenshots and recordings are optional too. Do not include diagnoses, student identifiers or other private information in a public issue.

Maintainers assess whether a barrier prevents finding a paper, reading its details, downloading it or requesting help. Reports that block these tasks receive priority. Use the issue discussion or email thread for updates and any available workaround. This volunteer project does not promise fixed response or resolution deadlines.

## Reviewing portal changes

For changes to the interface, contributors should check the affected journey and describe results in their pull request:

- Use the keyboard to search, change filters, open a paper and operate affected controls. Check focus visibility and order, and that menus and dialogs can be entered and exited without losing focus.
- Check that headings identify sections, controls have understandable labels, and errors and loading results are available to assistive technology.
- Inspect the changed page on a narrow screen and with enlarged text. Check both themes and avoid conveying a result through colour alone.
- Give informative images text alternatives; provide captions or transcripts when adding instructional media.
- For changed interactive components, try a screen reader where available and an automated accessibility checker. Record tools, results and any untested areas; automated scans do not replace checking the task manually.

There is no dedicated accessibility scanner configured in this repository. Do not report a scan as passed unless it was actually run. See [Contributing](./CONTRIBUTING.md) for the development workflow.

## Current limitations and alternatives

- The paper-request dialog does not yet implement explicit focus trapping and restoration. If it is difficult to use, email the details to ARICT using the contact address above.
- PDF previews use Google Drive. Preview controls and the accessibility of individual papers can vary. The paper page provides a download link so a student can use their preferred PDF reader.
- Some contributed PDFs may be scans without selectable text or document structure. Contact ARICT with the subject code and examination period to ask about a more accessible copy; availability depends on the source material.
- Keyboard and assistive-technology coverage across browsers has not been comprehensively verified. Include any environment-specific problem in a report so it can be investigated.

Maintainers should update this document when barriers are fixed or new limitations are confirmed.

## Reference

This project-specific guidance was informed by the [Open Source Accessibility Toolkit's accessibility statement](https://github.com/open-source-accessibility/accessibility-toolkit/blob/main/ACCESSIBILITY.md). Its project-specific claims and resolution deadlines have not been adopted here.
