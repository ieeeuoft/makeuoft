import re

from django import forms
from django.contrib.auth.forms import (
    PasswordChangeForm as _PasswordChangeForm,
    PasswordResetForm as _PasswordResetForm,
    SetPasswordForm as _SetPasswordForm,
    AuthenticationForm as _AuthenticationForm,
)

from event.models import InterestSubmission


class PasswordChangeForm(_PasswordChangeForm):
    def __init__(self, user, *args, **kwargs):
        super().__init__(user, *args, **kwargs)
        self.error_css_class = "invalid"
        self.label_suffix = ""


class PasswordResetForm(_PasswordResetForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.error_css_class = "invalid"
        self.label_suffix = ""


class SetPasswordForm(_SetPasswordForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.error_css_class = "invalid"
        self.label_suffix = ""


class AuthenticationForm(_AuthenticationForm):
    def clean_username(self):
        return self.cleaned_data["username"].lower()


class InterestForm(forms.ModelForm):
    """Public, ungated MLH interest form shown on the landing page.

    Modelled on registration.forms.ApplicationForm so the MLH-required fields,
    formats, and the two mandatory checkboxes behave identically.
    """

    error_css_class = "invalid"

    class Meta:
        model = InterestSubmission
        fields = [
            "first_name",
            "last_name",
            "email",
            "age",
            "phone_number",
            "school",
            "study_level",
            "country",
            "conduct_agree",
            "logistics_agree",
            "email_agree",
        ]
        widgets = {
            "school": forms.Select(
                # Choices are populated client-side by Select2 from MLH's
                # verified schools list (see landing.html).
                attrs={"class": "select2-school-select"},
                choices=((None, ""),),
            ),
            "phone_number": forms.TextInput(attrs={"placeholder": "+1 (123) 456-7890"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.label_suffix = ""
        self.fields["conduct_agree"].required = True
        self.fields["logistics_agree"].required = True

    def save(self, commit=True):
        self.instance = super().save(commit=False)
        self.instance.phone_number = re.sub("[^0-9]", "", self.instance.phone_number)
        if commit:
            self.instance.save()
        return self.instance
